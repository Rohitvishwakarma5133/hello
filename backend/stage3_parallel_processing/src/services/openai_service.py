"""
OpenAI service for Stage 3 - Parallel Processing Architecture.

This module provides a service layer for interacting with OpenAI's API
for text humanization, with comprehensive error handling, retry logic,
and monitoring integration.
"""

import time
from typing import Dict, Any, Optional, List
import openai
from openai import OpenAI
import tiktoken
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from ..config.settings import get_settings
from ..utils.logging import setup_logging, log_api_call
from ..utils.error_handling import (
    handle_openai_error,
    TransientAPIError,
    PermanentAPIError,
    ConfigurationError
)


class OpenAIService:
    """
    Service class for OpenAI API interactions with robust error handling.
    
    This service handles:
    - API key management
    - Request formatting
    - Response processing
    - Token counting and management
    - Error classification and handling
    - Rate limiting and retries
    - Monitoring and logging
    """
    
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize OpenAI service.
        
        Args:
            api_key: OpenAI API key (uses settings if not provided)
            model: Model to use (uses settings if not provided)
        """
        self.settings = get_settings()
        self.logger = setup_logging(self.__class__.__name__)
        
        # Initialize API key and model
        self.api_key = api_key or self.settings.openai.api_key
        self.model = model or self.settings.openai.model
        
        if not self.api_key:
            raise ConfigurationError("OpenAI API key is required")
        
        # Initialize OpenAI client
        self.client = OpenAI(api_key=self.api_key)
        
        # Initialize tokenizer for token counting
        try:
            self.tokenizer = tiktoken.encoding_for_model(self.model)
        except KeyError:
            # Fallback to cl100k_base for unknown models
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
            self.logger.warning(f"Unknown model {self.model}, using cl100k_base tokenizer")
        
        self.logger.info(f"OpenAI service initialized with model: {self.model}")
    
    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text using the model's tokenizer.
        
        Args:
            text: Text to count tokens for
            
        Returns:
            int: Number of tokens
        """
        return len(self.tokenizer.encode(text))
    
    def validate_request(self, text: str, prompt_template: str) -> None:
        """
        Validate API request parameters.
        
        Args:
            text: Text to humanize
            prompt_template: Prompt template to use
            
        Raises:
            PermanentAPIError: For validation failures
        """
        if not text or not text.strip():
            raise PermanentAPIError("Text cannot be empty")
        
        if not prompt_template or not prompt_template.strip():
            raise PermanentAPIError("Prompt template cannot be empty")
        
        # Check token limits
        text_tokens = self.count_tokens(text)
        prompt_tokens = self.count_tokens(prompt_template)
        total_input_tokens = text_tokens + prompt_tokens
        
        # Leave some buffer for the response
        max_input_tokens = self.settings.openai.max_tokens - 500
        
        if total_input_tokens > max_input_tokens:
            raise PermanentAPIError(
                f"Input too long: {total_input_tokens} tokens (max: {max_input_tokens})"
            )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type(TransientAPIError),
        reraise=True
    )
    def _make_api_call(self, messages: List[Dict[str, str]], task_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Make an API call to OpenAI with retry logic.
        
        Args:
            messages: Messages to send to OpenAI
            task_id: Task ID for logging correlation
            
        Returns:
            Dict: API response data
            
        Raises:
            TransientAPIError: For retryable errors
            PermanentAPIError: For permanent errors
        """
        start_time = time.time()
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.settings.openai.max_tokens,
                temperature=self.settings.openai.temperature,
                timeout=self.settings.openai.timeout
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            # Log successful API call
            log_api_call(
                api_name="openai",
                endpoint=f"/chat/completions/{self.model}",
                status_code=200,
                duration_ms=duration_ms,
                task_id=task_id
            )
            
            return {
                "response": response,
                "duration_ms": duration_ms,
                "status_code": 200
            }
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            # Convert to our exception types
            classified_error = handle_openai_error(e)
            
            # Log failed API call
            log_api_call(
                api_name="openai",
                endpoint=f"/chat/completions/{self.model}",
                status_code=getattr(classified_error, 'status_code', 0),
                duration_ms=duration_ms,
                task_id=task_id,
                error=str(classified_error)
            )
            
            raise classified_error
    
    def humanize_text(
        self, 
        text: str, 
        prompt_template: str, 
        task_id: Optional[str] = None,
        custom_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Humanize text using OpenAI API.
        
        Args:
            text: Text to humanize
            prompt_template: Prompt template for humanization
            task_id: Task ID for logging correlation
            custom_params: Custom parameters for the API call
            
        Returns:
            Dict containing:
                - humanized_text: The processed text
                - token_usage: Token consumption details
                - model: Model used
                - processing_time: Time taken for processing
                - metadata: Additional processing metadata
                
        Raises:
            TransientAPIError: For retryable errors
            PermanentAPIError: For permanent errors
        """
        start_time = time.time()
        
        self.logger.info(
            "Starting text humanization",
            text_length=len(text),
            model=self.model,
            task_id=task_id
        )
        
        try:
            # Validate request
            self.validate_request(text, prompt_template)
            
            # Prepare messages
            messages = [
                {
                    "role": "system",
                    "content": prompt_template
                },
                {
                    "role": "user",
                    "content": text
                }
            ]
            
            # Make API call
            api_result = self._make_api_call(messages, task_id)
            response = api_result["response"]
            
            # Extract result
            if not response.choices or not response.choices[0].message.content:
                raise PermanentAPIError("Empty response from OpenAI API")
            
            humanized_text = response.choices[0].message.content.strip()
            
            # Extract token usage
            token_usage = {}
            if response.usage:
                token_usage = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            
            processing_time = time.time() - start_time
            
            result = {
                "humanized_text": humanized_text,
                "token_usage": token_usage,
                "model": self.model,
                "processing_time": processing_time,
                "metadata": {
                    "api_duration_ms": api_result["duration_ms"],
                    "finish_reason": response.choices[0].finish_reason,
                    "response_id": response.id,
                    "created": response.created,
                    "task_id": task_id
                }
            }
            
            self.logger.info(
                "Text humanization completed",
                original_length=len(text),
                humanized_length=len(humanized_text),
                tokens_used=token_usage.get("total_tokens", 0),
                processing_time=processing_time,
                task_id=task_id
            )
            
            return result
            
        except (TransientAPIError, PermanentAPIError):
            # Re-raise our custom exceptions
            raise
            
        except Exception as e:
            # Handle unexpected errors
            self.logger.error(f"Unexpected error in text humanization: {e}", task_id=task_id)
            raise PermanentAPIError(f"Unexpected error: {str(e)}")
    
    def batch_humanize_texts(
        self, 
        texts: List[str], 
        prompt_template: str,
        task_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Humanize multiple texts in batch (sequential processing).
        
        Note: This is a sequential implementation. For true parallel processing,
        use the Celery tasks.
        
        Args:
            texts: List of texts to humanize
            prompt_template: Prompt template for humanization
            task_id: Task ID for logging correlation
            
        Returns:
            List of humanization results
        """
        self.logger.info(f"Starting batch humanization of {len(texts)} texts", task_id=task_id)
        
        results = []
        for i, text in enumerate(texts):
            try:
                result = self.humanize_text(
                    text=text,
                    prompt_template=prompt_template,
                    task_id=f"{task_id}_batch_{i}" if task_id else f"batch_{i}"
                )
                results.append(result)
                
            except Exception as e:
                self.logger.error(f"Failed to humanize text {i}: {e}")
                results.append({
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "text_index": i,
                    "original_text": text[:100] + "..." if len(text) > 100 else text
                })
        
        self.logger.info(f"Batch humanization completed: {len(results)} results", task_id=task_id)
        return results
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the OpenAI service.
        
        Returns:
            Dict: Health check result
        """
        try:
            # Make a simple API call to test connectivity
            test_result = self.humanize_text(
                text="Test message for health check.",
                prompt_template="Please respond with 'Health check successful.'",
                task_id="health_check"
            )
            
            return {
                "status": "healthy",
                "message": "OpenAI service is operational",
                "model": self.model,
                "response_time_ms": test_result["metadata"]["api_duration_ms"],
                "timestamp": time.time()
            }
            
        except PermanentAPIError as e:
            return {
                "status": "unhealthy",
                "message": f"OpenAI service has permanent issues: {e}",
                "error_code": getattr(e, 'error_code', 'unknown'),
                "timestamp": time.time()
            }
            
        except TransientAPIError as e:
            return {
                "status": "degraded",
                "message": f"OpenAI service is experiencing issues: {e}",
                "error_code": getattr(e, 'error_code', 'unknown'),
                "timestamp": time.time()
            }
            
        except Exception as e:
            return {
                "status": "unknown",
                "message": f"Unknown error during health check: {e}",
                "timestamp": time.time()
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.
        
        Returns:
            Dict: Model information
        """
        return {
            "model_name": self.model,
            "max_tokens": self.settings.openai.max_tokens,
            "temperature": self.settings.openai.temperature,
            "timeout": self.settings.openai.timeout,
            "tokenizer": self.tokenizer.name
        }
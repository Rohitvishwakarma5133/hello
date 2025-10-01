"""
Error handling utilities for Stage 3 - Parallel Processing Architecture.

This module defines custom exceptions and error handling strategies
for different types of failures in the parallel processing pipeline.
"""

from typing import Optional, Dict, Any


class HumanizationError(Exception):
    """Base exception for humanization-related errors."""
    
    def __init__(self, message: str, error_code: Optional[str] = None, context: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.context = context or {}


class TransientAPIError(HumanizationError):
    """
    Exception for transient API errors that should be retried.
    
    These errors are typically caused by:
    - Network timeouts
    - Rate limiting
    - Temporary service unavailability
    - Server overload (5xx errors)
    """
    
    def __init__(self, message: str, status_code: Optional[int] = None, retry_after: Optional[int] = None, **kwargs):
        super().__init__(message, **kwargs)
        self.status_code = status_code
        self.retry_after = retry_after


class PermanentAPIError(HumanizationError):
    """
    Exception for permanent API errors that should not be retried.
    
    These errors are typically caused by:
    - Invalid API key
    - Malformed requests
    - Content policy violations
    - Authentication failures
    - Client errors (4xx except 429)
    """
    
    def __init__(self, message: str, status_code: Optional[int] = None, **kwargs):
        super().__init__(message, **kwargs)
        self.status_code = status_code


class ChunkProcessingError(HumanizationError):
    """Exception for chunk-specific processing errors."""
    
    def __init__(self, message: str, chunk_id: Optional[str] = None, **kwargs):
        super().__init__(message, **kwargs)
        self.chunk_id = chunk_id


class ConfigurationError(HumanizationError):
    """Exception for configuration-related errors."""
    pass


class ServiceUnavailableError(TransientAPIError):
    """Exception for when external services are unavailable."""
    pass


def classify_api_error(status_code: int, error_message: str) -> HumanizationError:
    """
    Classify an API error based on status code and message.
    
    Args:
        status_code: HTTP status code
        error_message: Error message from the API
        
    Returns:
        HumanizationError: Appropriate exception type
    """
    
    if status_code in [429]:  # Rate limiting
        return TransientAPIError(
            f"Rate limited: {error_message}",
            status_code=status_code,
            error_code="RATE_LIMITED"
        )
    
    elif 500 <= status_code < 600:  # Server errors
        return TransientAPIError(
            f"Server error: {error_message}",
            status_code=status_code,
            error_code="SERVER_ERROR"
        )
    
    elif status_code in [401, 403]:  # Authentication/Authorization
        return PermanentAPIError(
            f"Authentication error: {error_message}",
            status_code=status_code,
            error_code="AUTH_ERROR"
        )
    
    elif status_code == 400:  # Bad request
        return PermanentAPIError(
            f"Bad request: {error_message}",
            status_code=status_code,
            error_code="BAD_REQUEST"
        )
    
    elif 400 <= status_code < 500:  # Other client errors
        return PermanentAPIError(
            f"Client error: {error_message}",
            status_code=status_code,
            error_code="CLIENT_ERROR"
        )
    
    else:
        # Unknown error - treat as transient to be safe
        return TransientAPIError(
            f"Unknown error: {error_message}",
            status_code=status_code,
            error_code="UNKNOWN_ERROR"
        )


def handle_openai_error(error) -> HumanizationError:
    """
    Handle OpenAI-specific errors and convert to our exception types.
    
    Args:
        error: OpenAI error object
        
    Returns:
        HumanizationError: Appropriate exception type
    """
    
    error_message = str(error)
    
    # Handle different OpenAI error types
    if hasattr(error, 'status_code'):
        return classify_api_error(error.status_code, error_message)
    
    # Handle specific OpenAI error types
    error_type = type(error).__name__
    
    if 'RateLimitError' in error_type:
        return TransientAPIError(
            f"OpenAI rate limit exceeded: {error_message}",
            error_code="OPENAI_RATE_LIMIT"
        )
    
    elif 'APIConnectionError' in error_type:
        return TransientAPIError(
            f"OpenAI connection error: {error_message}",
            error_code="OPENAI_CONNECTION_ERROR"
        )
    
    elif 'AuthenticationError' in error_type:
        return PermanentAPIError(
            f"OpenAI authentication error: {error_message}",
            error_code="OPENAI_AUTH_ERROR"
        )
    
    elif 'InvalidRequestError' in error_type:
        return PermanentAPIError(
            f"OpenAI invalid request: {error_message}",
            error_code="OPENAI_INVALID_REQUEST"
        )
    
    elif 'ServiceUnavailableError' in error_type:
        return TransientAPIError(
            f"OpenAI service unavailable: {error_message}",
            error_code="OPENAI_SERVICE_UNAVAILABLE"
        )
    
    else:
        # Unknown OpenAI error - treat as transient
        return TransientAPIError(
            f"Unknown OpenAI error: {error_message}",
            error_code="OPENAI_UNKNOWN_ERROR"
        )


class ErrorHandler:
    """Centralized error handling utility."""
    
    @staticmethod
    def should_retry(error: Exception) -> bool:
        """
        Determine if an error should trigger a retry.
        
        Args:
            error: Exception to evaluate
            
        Returns:
            bool: True if error should be retried
        """
        return isinstance(error, TransientAPIError)
    
    @staticmethod
    def get_retry_delay(error: Exception, attempt: int) -> int:
        """
        Calculate retry delay based on error type and attempt number.
        
        Args:
            error: Exception that occurred
            attempt: Current attempt number (0-based)
            
        Returns:
            int: Delay in seconds
        """
        base_delay = 60  # 1 minute base delay
        
        if isinstance(error, TransientAPIError):
            # Check if the API provides a retry-after header
            if hasattr(error, 'retry_after') and error.retry_after:
                return error.retry_after
            
            # Exponential backoff with jitter
            import random
            delay = min(base_delay * (2 ** attempt), 600)  # Max 10 minutes
            jitter = random.uniform(0.5, 1.5)
            return int(delay * jitter)
        
        return base_delay
    
    @staticmethod
    def format_error_for_logging(error: Exception, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format error information for structured logging.
        
        Args:
            error: Exception to format
            context: Additional context information
            
        Returns:
            Dict: Formatted error data
        """
        error_data = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "is_retryable": ErrorHandler.should_retry(error),
            **context
        }
        
        # Add specific error attributes
        if isinstance(error, HumanizationError):
            if error.error_code:
                error_data["error_code"] = error.error_code
            if error.context:
                error_data["error_context"] = error.context
        
        if isinstance(error, (TransientAPIError, PermanentAPIError)):
            if hasattr(error, 'status_code') and error.status_code:
                error_data["status_code"] = error.status_code
        
        if isinstance(error, ChunkProcessingError):
            if error.chunk_id:
                error_data["chunk_id"] = error.chunk_id
        
        return error_data
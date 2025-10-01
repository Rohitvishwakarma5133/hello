"""
Core Celery tasks for Stage 3 - Parallel Processing Architecture.

This module implements the fundamental tasks for parallel text humanization:
- humanize_chunk_task: Processes individual text chunks using OpenAI API
- merge_chunks_task: Merges processed chunks back into coherent text
- verification_task: Validates the humanized output (for Stage 4 integration)
"""

import time
from typing import List, Dict, Any, Optional, Tuple
import openai
from celery import Task
from celery.exceptions import Retry, MaxRetriesExceededError
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from ..core.celery_app import celery_app
from ..config.settings import get_settings
from ..utils.logging import TaskContextLogger, log_api_call, log_error_with_context
from ..services.openai_service import OpenAIService
from ..utils.error_handling import (
    HumanizationError, 
    TransientAPIError, 
    PermanentAPIError,
    ChunkProcessingError
)


# Initialize settings
settings = get_settings()


class BaseHumanizationTask(Task):
    """Base task class with common functionality for humanization tasks."""
    
    abstract = True
    autoretry_for = (TransientAPIError, requests.exceptions.RequestException)
    max_retries = settings.celery.task_max_retries
    retry_backoff = settings.celery.task_retry_backoff
    retry_backoff_max = settings.celery.task_retry_backoff_max
    retry_jitter = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure by logging and potentially routing to dead letter queue."""
        with TaskContextLogger("task_failure", task_id) as logger:
            log_error_with_context(
                logger, 
                exc, 
                {
                    "task_name": self.name,
                    "args": args,
                    "kwargs": kwargs
                },
                task_id
            )
            
            # If all retries exhausted, route to dead letter queue
            if isinstance(exc, MaxRetriesExceededError):
                dead_letter_task.delay({
                    "original_task": self.name,
                    "task_id": task_id,
                    "args": args,
                    "kwargs": kwargs,
                    "error": str(exc),
                    "failure_time": time.time()
                })


@celery_app.task(bind=True, base=BaseHumanizationTask, name="stage3.tasks.humanize_chunk_task")
def humanize_chunk_task(
    self, 
    chunk_data: Dict[str, Any], 
    humanization_prompt: str,
    task_metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Process a single text chunk using OpenAI API for humanization.
    
    This is the core task that handles individual chunk processing in parallel.
    It includes comprehensive error handling, automatic retries with exponential
    backoff, and detailed logging for monitoring.
    
    Args:
        chunk_data: Dictionary containing chunk information:
            - id: Unique chunk identifier
            - content: Text content to humanize
            - index: Order index for reassembly
            - metadata: Additional chunk metadata
        humanization_prompt: The engineered prompt for humanization
        task_metadata: Additional task-specific metadata
        
    Returns:
        Dict containing:
            - chunk_id: Original chunk ID
            - original_content: Original text
            - humanized_content: Processed text
            - processing_time: Time taken for processing
            - token_usage: API token consumption
            - index: Order index for reassembly
            - metadata: Processing metadata
            
    Raises:
        PermanentAPIError: For unrecoverable API errors
        TransientAPIError: For retryable API errors
        ChunkProcessingError: For chunk-specific processing errors
    """
    
    chunk_id = chunk_data.get("id", "unknown")
    chunk_content = chunk_data.get("content", "")
    chunk_index = chunk_data.get("index", 0)
    
    with TaskContextLogger("humanize_chunk", self.request.id) as logger:
        logger.info(
            "Processing chunk",
            chunk_id=chunk_id,
            chunk_index=chunk_index,
            content_length=len(chunk_content),
            retry_count=self.request.retries
        )
        
        start_time = time.time()
        
        try:
            # Initialize OpenAI service
            openai_service = OpenAIService()
            
            # Validate chunk content
            if not chunk_content or not chunk_content.strip():
                raise ChunkProcessingError(f"Empty or invalid chunk content: {chunk_id}")
            
            if len(chunk_content) > settings.openai.max_tokens * 4:  # Rough token estimation
                raise ChunkProcessingError(f"Chunk too large: {chunk_id}")
            
            # Process the chunk
            result = openai_service.humanize_text(
                text=chunk_content,
                prompt_template=humanization_prompt,
                task_id=self.request.id
            )
            
            processing_time = time.time() - start_time
            
            # Prepare response
            response_data = {
                "chunk_id": chunk_id,
                "original_content": chunk_content,
                "humanized_content": result["humanized_text"],
                "processing_time": processing_time,
                "token_usage": result.get("token_usage", {}),
                "index": chunk_index,
                "metadata": {
                    "task_id": self.request.id,
                    "processing_time": processing_time,
                    "retry_count": self.request.retries,
                    "model_used": result.get("model", "unknown"),
                    **(task_metadata or {})
                }
            }
            
            logger.info(
                "Chunk processed successfully",
                chunk_id=chunk_id,
                processing_time=processing_time,
                tokens_used=result.get("token_usage", {}).get("total_tokens", 0),
                humanized_length=len(result["humanized_text"])
            )
            
            return response_data
            
        except (PermanentAPIError, ChunkProcessingError) as e:
            # Don't retry permanent errors
            logger.error(f"Permanent error processing chunk {chunk_id}: {e}")
            raise e
            
        except TransientAPIError as e:
            # Log and retry transient errors
            logger.warning(
                f"Transient error processing chunk {chunk_id}: {e}",
                retry_count=self.request.retries,
                max_retries=self.max_retries
            )
            
            # Use Celery's built-in retry mechanism
            raise self.retry(
                countdown=min(60 * (2 ** self.request.retries), settings.celery.task_retry_backoff_max),
                exc=e
            )
            
        except Exception as e:
            # Handle unexpected errors
            logger.error(f"Unexpected error processing chunk {chunk_id}: {e}")
            log_error_with_context(logger, e, {"chunk_id": chunk_id}, self.request.id)
            raise ChunkProcessingError(f"Unexpected error processing chunk {chunk_id}: {str(e)}")


@celery_app.task(bind=True, name="stage3.tasks.merge_chunks_task")
def merge_chunks_task(self, chunk_results: List[Dict[str, Any]], merge_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Merge processed chunks back into coherent text.
    
    This callback task is executed after all chunks have been processed in parallel.
    It reassembles the chunks in the correct order and performs any necessary
    post-processing to ensure text coherence.
    
    Args:
        chunk_results: List of processed chunk results from humanize_chunk_task
        merge_metadata: Additional metadata for the merge operation
        
    Returns:
        Dict containing:
            - humanized_text: Complete merged text
            - processing_summary: Summary of processing statistics
            - chunk_count: Number of chunks processed
            - total_processing_time: Combined processing time
            - token_usage_summary: Aggregated token usage
            - metadata: Merge operation metadata
    """
    
    with TaskContextLogger("merge_chunks", self.request.id) as logger:
        start_time = time.time()
        
        logger.info(
            "Starting chunk merge",
            chunk_count=len(chunk_results),
            merge_metadata=merge_metadata
        )
        
        try:
            if not chunk_results:
                raise ChunkProcessingError("No chunk results to merge")
            
            # Sort chunks by index to maintain original order
            sorted_chunks = sorted(chunk_results, key=lambda x: x.get("index", 0))
            
            # Validate chunk integrity
            expected_indices = set(range(len(sorted_chunks)))
            actual_indices = {chunk.get("index", -1) for chunk in sorted_chunks}
            
            if expected_indices != actual_indices:
                missing_indices = expected_indices - actual_indices
                logger.warning(f"Missing chunk indices: {missing_indices}")
                # Continue with available chunks but log the issue
            
            # Merge the text content
            humanized_segments = []
            total_processing_time = 0
            total_tokens = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            
            for chunk in sorted_chunks:
                humanized_content = chunk.get("humanized_content", "")
                if humanized_content:
                    humanized_segments.append(humanized_content)
                
                # Aggregate processing time
                total_processing_time += chunk.get("processing_time", 0)
                
                # Aggregate token usage
                token_usage = chunk.get("token_usage", {})
                for key in ["prompt_tokens", "completion_tokens", "total_tokens"]:
                    total_tokens[key] += token_usage.get(key, 0)
            
            # Join segments with appropriate spacing
            humanized_text = self._join_text_segments(humanized_segments)
            
            # Perform post-processing cleanup
            humanized_text = self._post_process_text(humanized_text)
            
            merge_time = time.time() - start_time
            
            # Prepare summary
            processing_summary = {
                "chunks_processed": len(chunk_results),
                "chunks_merged": len(humanized_segments),
                "total_processing_time": total_processing_time,
                "merge_time": merge_time,
                "original_length": sum(len(chunk.get("original_content", "")) for chunk in chunk_results),
                "humanized_length": len(humanized_text),
                "average_chunk_processing_time": total_processing_time / len(chunk_results) if chunk_results else 0
            }
            
            result = {
                "humanized_text": humanized_text,
                "processing_summary": processing_summary,
                "chunk_count": len(chunk_results),
                "total_processing_time": total_processing_time + merge_time,
                "token_usage_summary": total_tokens,
                "metadata": {
                    "task_id": self.request.id,
                    "merge_time": merge_time,
                    "chunks_processed": len(chunk_results),
                    **(merge_metadata or {})
                }
            }
            
            logger.info(
                "Chunk merge completed successfully",
                chunks_merged=len(humanized_segments),
                final_length=len(humanized_text),
                total_processing_time=total_processing_time + merge_time,
                total_tokens=total_tokens["total_tokens"]
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error merging chunks: {e}")
            log_error_with_context(logger, e, {"chunk_count": len(chunk_results)}, self.request.id)
            raise ChunkProcessingError(f"Failed to merge chunks: {str(e)}")
    
    def _join_text_segments(self, segments: List[str]) -> str:
        """
        Intelligently join text segments with appropriate spacing.
        
        Args:
            segments: List of text segments to join
            
        Returns:
            str: Joined text with proper spacing
        """
        if not segments:
            return ""
        
        if len(segments) == 1:
            return segments[0]
        
        # Join with double newlines for paragraph separation
        # This can be enhanced with more sophisticated logic
        joined = "\n\n".join(segment.strip() for segment in segments if segment.strip())
        return joined
    
    def _post_process_text(self, text: str) -> str:
        """
        Perform post-processing cleanup on merged text.
        
        Args:
            text: Merged text to clean up
            
        Returns:
            str: Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        import re
        
        # Replace multiple consecutive newlines with double newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Remove trailing whitespace from lines
        text = '\n'.join(line.rstrip() for line in text.split('\n'))
        
        # Ensure text ends with single newline
        text = text.rstrip() + '\n' if text.rstrip() else ""
        
        return text


@celery_app.task(bind=True, name="stage3.tasks.verification_task")
def verification_task(self, humanized_result: Dict[str, Any], verification_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Verify the humanized text quality (placeholder for Stage 4 integration).
    
    This task will be fully implemented in Stage 4 but is included here
    for the chain workflow architecture.
    
    Args:
        humanized_result: Result from merge_chunks_task
        verification_config: Configuration for verification process
        
    Returns:
        Dict containing verification results and final output
    """
    
    with TaskContextLogger("verification", self.request.id) as logger:
        logger.info("Starting text verification (placeholder)")
        
        # For now, just pass through the result with verification metadata
        result = {
            **humanized_result,
            "verification_status": "pending_stage4_implementation",
            "verification_metadata": {
                "task_id": self.request.id,
                "verification_time": time.time(),
                "status": "bypassed"
            }
        }
        
        logger.info("Verification completed (placeholder)")
        return result


@celery_app.task(bind=True, name="stage3.tasks.dead_letter_task")
def dead_letter_task(self, failed_task_data: Dict[str, Any]) -> None:
    """
    Handle tasks that have failed after all retry attempts.
    
    This task logs failed tasks and stores them for manual analysis.
    
    Args:
        failed_task_data: Information about the failed task
    """
    
    with TaskContextLogger("dead_letter", self.request.id) as logger:
        logger.error(
            "Task routed to dead letter queue",
            original_task=failed_task_data.get("original_task"),
            original_task_id=failed_task_data.get("task_id"),
            error=failed_task_data.get("error"),
            failure_time=failed_task_data.get("failure_time")
        )
        
        # In a production system, this would:
        # 1. Store the failed task in a database for analysis
        # 2. Send alerts to administrators
        # 3. Update monitoring dashboards
        # 4. Potentially trigger automated remediation
        
        # For now, just log the failure
        logger.info("Dead letter task processed - manual analysis required")
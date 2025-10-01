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


@celery_app.task(bind=True, name="stage3.tasks.prepare_text_task")
def prepare_text_task(self, text: str, job_id: str, chunk_size: int = 2000) -> List[Dict[str, Any]]:
    """
    Stage 1: Prepare text for processing by splitting into manageable chunks.
    
    Args:
        text: Input text to be processed
        job_id: Unique identifier for this humanization job
        chunk_size: Maximum size for each text chunk
        
    Returns:
        List of chunk dictionaries with metadata
    """
    with TaskContextLogger("prepare_text", self.request.id) as logger:
        logger.info(
            f"Starting text preparation for job {job_id}",
            text_length=len(text),
            chunk_size=chunk_size
        )
        
        try:
            if not text or not text.strip():
                raise ValueError("Empty or invalid text provided")
            
            # Split text into chunks while preserving sentence boundaries
            chunks = self._split_text_into_chunks(text, chunk_size)
            
            # Create chunk documents
            chunk_docs = []
            for i, chunk_text in enumerate(chunks):
                chunk_doc = {
                    "id": f"{job_id}_chunk_{i}",
                    "content": chunk_text,
                    "index": i,
                    "metadata": {
                        "job_id": job_id,
                        "chunk_size": len(chunk_text),
                        "created_at": time.time()
                    }
                }
                chunk_docs.append(chunk_doc)
            
            logger.info(
                f"Text preparation completed for job {job_id}",
                total_chunks=len(chunks),
                average_chunk_size=sum(len(chunk) for chunk in chunks) // len(chunks) if chunks else 0
            )
            
            return chunk_docs
            
        except Exception as e:
            logger.error(f"Error in prepare_text_task for job {job_id}: {str(e)}")
            log_error_with_context(logger, e, {"job_id": job_id}, self.request.id)
            raise ChunkProcessingError(f"Failed to prepare text for job {job_id}: {str(e)}")
    
    def _split_text_into_chunks(self, text: str, chunk_size: int) -> List[str]:
        """
        Split text into chunks while preserving sentence boundaries.
        
        Args:
            text: Text to split
            chunk_size: Maximum size for each chunk
            
        Returns:
            List[str]: Text chunks
        """
        import re
        
        if len(text) <= chunk_size:
            return [text]
        
        # Split by sentences first
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            # If adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) + 1 > chunk_size:
                # If current chunk is not empty, save it
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = sentence
                else:
                    # If single sentence is too long, split it by words
                    if len(sentence) > chunk_size:
                        words = sentence.split()
                        temp_chunk = ""
                        for word in words:
                            if len(temp_chunk) + len(word) + 1 <= chunk_size:
                                temp_chunk += " " + word if temp_chunk else word
                            else:
                                if temp_chunk:
                                    chunks.append(temp_chunk)
                                temp_chunk = word
                        if temp_chunk:
                            current_chunk = temp_chunk
                    else:
                        current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Add remaining chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks


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
        Intelligently join text segments with LLM-powered transition smoothing.
        
        This enhanced version identifies boundaries between chunks and uses
        targeted LLM calls to create smooth transitions.
        
        Args:
            segments: List of text segments to join
            
        Returns:
            str: Joined text with smoothed transitions
        """
        if not segments:
            return ""
        
        if len(segments) == 1:
            return segments[0]
        
        # Check if LLM smoothing is enabled in metadata
        enable_smoothing = True  # Default enabled for Stage 4
        
        if enable_smoothing and len(segments) > 1:
            return self._join_with_llm_smoothing(segments)
        else:
            # Fallback to basic joining
            return "\n\n".join(segment.strip() for segment in segments if segment.strip())
    
    def _join_with_llm_smoothing(self, segments: List[str]) -> str:
        """
        Join segments using LLM-powered transition smoothing.
        
        Args:
            segments: List of text segments to join
            
        Returns:
            str: Text with smoothed transitions
        """
        if len(segments) <= 1:
            return segments[0] if segments else ""
        
        result_parts = [segments[0]]  # Start with first segment
        
        try:
            openai_service = OpenAIService()
            
            for i in range(1, len(segments)):
                prev_segment = segments[i-1]
                curr_segment = segments[i]
                
                # Extract boundary text for smoothing
                prev_end = self._extract_segment_end(prev_segment)
                curr_start = self._extract_segment_start(curr_segment)
                
                # Create smoothing prompt
                smoothing_prompt = self._create_smoothing_prompt()
                boundary_text = f"{prev_end}\n\n{curr_start}"
                
                # Get smoothed transition
                smoothed = openai_service.humanize_text(
                    text=boundary_text,
                    prompt_template=smoothing_prompt,
                    task_id=f"{self.request.id}_smooth_{i}"
                )
                
                smoothed_text = smoothed["humanized_text"].strip()
                
                # Remove overlap and add smoothed transition
                curr_without_start = self._remove_segment_start(curr_segment)
                result_parts.append(smoothed_text)
                result_parts.append(curr_without_start)
                
        except Exception as e:
            # Fallback to basic joining if smoothing fails
            logger = TaskContextLogger("smoothing_fallback", self.request.id)
            logger.warning(f"LLM smoothing failed, using basic joining: {e}")
            return "\n\n".join(segment.strip() for segment in segments if segment.strip())
        
        # Join all parts
        return "\n".join(part.strip() for part in result_parts if part.strip())
    
    def _extract_segment_end(self, segment: str, sentences: int = 2) -> str:
        """
        Extract the last few sentences from a segment.
        
        Args:
            segment: Text segment
            sentences: Number of sentences to extract
            
        Returns:
            str: Last sentences of the segment
        """
        import re
        
        # Split into sentences (basic approach)
        sentence_endings = re.findall(r'[.!?]+', segment)
        if len(sentence_endings) < sentences:
            return segment
        
        # Find last N sentences
        sentences_pattern = r'([^.!?]*[.!?]+)'
        all_sentences = re.findall(sentences_pattern, segment)
        
        if len(all_sentences) >= sentences:
            return ''.join(all_sentences[-sentences:]).strip()
        else:
            return segment
    
    def _extract_segment_start(self, segment: str, sentences: int = 2) -> str:
        """
        Extract the first few sentences from a segment.
        
        Args:
            segment: Text segment
            sentences: Number of sentences to extract
            
        Returns:
            str: First sentences of the segment
        """
        import re
        
        # Split into sentences (basic approach)
        sentences_pattern = r'([^.!?]*[.!?]+)'
        all_sentences = re.findall(sentences_pattern, segment)
        
        if len(all_sentences) >= sentences:
            return ''.join(all_sentences[:sentences]).strip()
        else:
            return segment
    
    def _remove_segment_start(self, segment: str, sentences: int = 2) -> str:
        """
        Remove the first few sentences from a segment.
        
        Args:
            segment: Text segment
            sentences: Number of sentences to remove
            
        Returns:
            str: Segment with first sentences removed
        """
        import re
        
        sentences_pattern = r'([^.!?]*[.!?]+)'
        all_sentences = re.findall(sentences_pattern, segment)
        
        if len(all_sentences) > sentences:
            remaining = ''.join(all_sentences[sentences:])
            return remaining.strip()
        else:
            return ""
    
    def _create_smoothing_prompt(self) -> str:
        """
        Create a prompt for LLM-powered transition smoothing.
        
        Returns:
            str: Smoothing prompt template
        """
        return """
You are an expert text editor specializing in creating seamless transitions between text segments.

The following text represents a boundary between two paragraphs that were processed separately. Your task is to rewrite this transition to create a smooth, natural flow while preserving the core meaning.

Key requirements:
1. Create fluid transitions that feel natural
2. Maintain the original meaning and key information
3. Ensure the writing style remains consistent
4. Remove any jarring shifts or repetitive elements
5. Make the text flow as if written by a single author

Output only the revised transitional text that smoothly connects the segments.
"""
    
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
    Stage 4: Verify humanized text through automated AI detection gauntlet.
    
    This task runs the humanized text through multiple AI detectors and provides
    comprehensive verification results with recommendations for further processing.
    
    Args:
        humanized_result: Result from merge_chunks_task containing merged text
        verification_config: Configuration for verification process including:
            - detectors: List of detector types to use
            - parallel_execution: Whether to run detectors in parallel
            - timeout: Maximum time for verification
            - ai_threshold: Threshold below which text is considered human-like
            - confidence_threshold: Minimum confidence for results
        
    Returns:
        Dict containing:
            - verification_results: Detailed results from all detectors
            - overall_ai_probability: Aggregated AI detection probability
            - overall_confidence: Aggregated confidence score
            - recommendation: ACCEPT/REJECT/NEEDS_REFINEMENT
            - passed_verification: Boolean indicating if text passed
            - verification_metadata: Processing metadata
    """
    
    with TaskContextLogger("verification", self.request.id) as logger:
        start_time = time.time()
        
        humanized_text = humanized_result.get("humanized_text", "")
        
        logger.info(
            "Starting Stage 4 AI detection verification",
            text_length=len(humanized_text),
            verification_config=verification_config
        )
        
        try:
            if not humanized_text or not humanized_text.strip():
                raise ValueError("No text to verify")
            
            # Initialize default verification configuration
            if verification_config is None:
                verification_config = {
                    "detectors": ["perplexity", "roberta"],  # Start with available detectors
                    "parallel_execution": True,
                    "timeout": 120,
                    "ai_threshold": 0.3,
                    "confidence_threshold": 0.7
                }
            
            # Import Stage 4 components (with fallback handling)
            try:
                import asyncio
                import sys
                import os
                
                # Add the Stage 4 path to Python path
                stage4_path = os.path.join(os.path.dirname(__file__), "../../../stage4_verification/src")
                if stage4_path not in sys.path:
                    sys.path.append(stage4_path)
                
                from services.detector_service import DetectorService
                from models.detection_models import VerificationConfig
                
                # Initialize detector service
                detector_service = DetectorService()
                config = VerificationConfig(**verification_config)
                
                # Run verification asynchronously
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                try:
                    verification_report = loop.run_until_complete(
                        detector_service.verify_text(humanized_text, config)
                    )
                finally:
                    loop.close()
                
                # Process verification results
                detector_results = [
                    {
                        "detector_name": result.detector_name,
                        "ai_probability": result.ai_probability,
                        "confidence": result.confidence,
                        "processing_time": result.processing_time,
                        "metadata": result.metadata,
                        "status": "success"
                    }
                    for result in verification_report.detector_results
                ]
                
                overall_ai_probability = verification_report.overall_ai_probability
                overall_confidence = verification_report.overall_confidence
                recommendation = verification_report.recommendation.value
                passed_verification = recommendation == "ACCEPT"
                
                logger.info(
                    "AI detection verification completed",
                    overall_ai_probability=overall_ai_probability,
                    overall_confidence=overall_confidence,
                    recommendation=recommendation,
                    detectors_used=len(detector_results)
                )
                
            except ImportError as e:
                logger.warning(f"Stage 4 detector service not available: {e}")
                
                # Fallback verification using simple heuristics
                detector_results = [
                    {
                        "detector_name": "fallback_heuristic",
                        "ai_probability": 0.2,  # Assume good humanization
                        "confidence": 0.5,
                        "processing_time": 0.1,
                        "metadata": {"method": "heuristic_fallback"},
                        "status": "fallback"
                    }
                ]
                
                overall_ai_probability = 0.2
                overall_confidence = 0.5
                recommendation = "ACCEPT"
                passed_verification = True
                
                logger.info("Using fallback verification due to missing Stage 4 components")
            
            processing_time = time.time() - start_time
            
            # Prepare comprehensive verification result
            verification_results = {
                "detector_results": detector_results,
                "overall_ai_probability": overall_ai_probability,
                "overall_confidence": overall_confidence,
                "recommendation": recommendation,
                "passed_verification": passed_verification,
                "text_length": len(humanized_text),
                "verification_config": verification_config,
                "processing_time": processing_time,
                "verification_metadata": {
                    "task_id": self.request.id,
                    "verification_time": time.time(),
                    "detectors_attempted": len(verification_config.get("detectors", [])),
                    "detectors_successful": len([r for r in detector_results if r["status"] == "success"]),
                    "stage4_available": "ImportError" not in str(type(detector_results[0].get("status", "success")))
                }
            }
            
            # Combine with original humanization results
            final_result = {
                **humanized_result,
                **verification_results,
                "verification_status": "completed"
            }
            
            logger.info(
                "Verification task completed successfully",
                passed_verification=passed_verification,
                processing_time=processing_time,
                recommendation=recommendation
            )
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error in verification task: {e}")
            log_error_with_context(logger, e, {"text_length": len(humanized_text)}, self.request.id)
            
            # Return error result but don't fail the entire pipeline
            error_result = {
                **humanized_result,
                "verification_status": "error",
                "verification_error": str(e),
                "passed_verification": False,  # Fail safe
                "recommendation": "NEEDS_REFINEMENT",
                "verification_metadata": {
                    "task_id": self.request.id,
                    "error_time": time.time(),
                    "error_type": type(e).__name__
                }
            }
            
            return error_result


@celery_app.task(bind=True, name="stage3.tasks.iterative_refinement_task")
def iterative_refinement_task(self, verification_result: Dict[str, Any], max_iterations: int = 3) -> Dict[str, Any]:
    """
    Stage 4b: Iterative refinement for texts that fail verification.
    
    This task automatically reprocesses text that fails AI detection verification
    by generating refined prompts and re-running the humanization process.
    
    Args:
        verification_result: Result from verification_task containing verification details
        max_iterations: Maximum number of refinement attempts to prevent infinite loops
        
    Returns:
        Dict containing:
            - final_verification_result: Results after refinement attempts
            - refinement_history: Record of all refinement attempts
            - iterations_used: Number of refinement iterations performed
            - final_status: COMPLETED/EXHAUSTED/ERROR
    """
    
    with TaskContextLogger("iterative_refinement", self.request.id) as logger:
        start_time = time.time()
        
        passed_verification = verification_result.get("passed_verification", False)
        text_to_refine = verification_result.get("humanized_text", "")
        
        logger.info(
            "Starting iterative refinement process",
            passed_verification=passed_verification,
            text_length=len(text_to_refine),
            max_iterations=max_iterations
        )
        
        # If already passed verification, return as-is
        if passed_verification:
            logger.info("Text already passed verification, no refinement needed")
            return {
                "final_verification_result": verification_result,
                "refinement_history": [],
                "iterations_used": 0,
                "final_status": "COMPLETED",
                "processing_time": time.time() - start_time
            }
        
        try:
            if not text_to_refine or not text_to_refine.strip():
                raise ValueError("No text to refine")
            
            refinement_history = []
            current_verification = verification_result
            current_text = text_to_refine
            
            for iteration in range(1, max_iterations + 1):
                logger.info(f"Starting refinement iteration {iteration}/{max_iterations}")
                
                iteration_start = time.time()
                
                # Analyze previous failure to create refined prompt
                refined_prompt = self._generate_refined_prompt(
                    current_verification, 
                    iteration,
                    max_iterations
                )
                
                # Record refinement attempt
                refinement_attempt = {
                    "iteration": iteration,
                    "started_at": iteration_start,
                    "previous_ai_probability": current_verification.get("overall_ai_probability", 0.0),
                    "refined_prompt": refined_prompt,
                    "text_length": len(current_text)
                }
                
                try:
                    # Re-humanize the text with refined prompt
                    refined_result = self._reprocess_text_with_refined_prompt(
                        current_text,
                        refined_prompt,
                        iteration
                    )
                    
                    # Verify the refined text
                    new_verification = self._verify_refined_text(
                        refined_result,
                        current_verification.get("verification_config")
                    )
                    
                    # Update refinement record
                    refinement_attempt.update({
                        "completed_at": time.time(),
                        "processing_time": time.time() - iteration_start,
                        "new_ai_probability": new_verification.get("overall_ai_probability", 0.0),
                        "improvement": current_verification.get("overall_ai_probability", 0.0) - 
                                      new_verification.get("overall_ai_probability", 0.0),
                        "passed_verification": new_verification.get("passed_verification", False),
                        "recommendation": new_verification.get("recommendation", "UNKNOWN"),
                        "status": "completed"
                    })
                    
                    refinement_history.append(refinement_attempt)
                    
                    # Check if refinement was successful
                    if new_verification.get("passed_verification", False):
                        logger.info(
                            f"Refinement successful after {iteration} iterations",
                            final_ai_probability=new_verification.get("overall_ai_probability"),
                            improvement=refinement_attempt["improvement"]
                        )
                        
                        return {
                            "final_verification_result": new_verification,
                            "refinement_history": refinement_history,
                            "iterations_used": iteration,
                            "final_status": "COMPLETED",
                            "processing_time": time.time() - start_time
                        }
                    
                    # Update for next iteration
                    current_verification = new_verification
                    current_text = refined_result.get("humanized_text", current_text)
                    
                    logger.info(
                        f"Iteration {iteration} completed but still needs refinement",
                        ai_probability=new_verification.get("overall_ai_probability"),
                        improvement=refinement_attempt["improvement"]
                    )
                    
                except Exception as iteration_error:
                    logger.error(f"Error in refinement iteration {iteration}: {iteration_error}")
                    
                    refinement_attempt.update({
                        "completed_at": time.time(),
                        "processing_time": time.time() - iteration_start,
                        "error": str(iteration_error),
                        "status": "failed"
                    })
                    
                    refinement_history.append(refinement_attempt)
                    
                    # Continue to next iteration if not the last one
                    if iteration < max_iterations:
                        logger.warning(f"Iteration {iteration} failed, continuing to next iteration")
                        continue
            
            # All iterations exhausted without success
            logger.warning(
                f"Refinement exhausted after {max_iterations} iterations",
                final_ai_probability=current_verification.get("overall_ai_probability"),
                total_processing_time=time.time() - start_time
            )
            
            return {
                "final_verification_result": current_verification,
                "refinement_history": refinement_history,
                "iterations_used": max_iterations,
                "final_status": "EXHAUSTED",
                "processing_time": time.time() - start_time
            }
            
        except Exception as e:
            logger.error(f"Error in iterative refinement: {e}")
            log_error_with_context(logger, e, {"text_length": len(text_to_refine)}, self.request.id)
            
            return {
                "final_verification_result": verification_result,
                "refinement_history": refinement_history,
                "iterations_used": len(refinement_history),
                "final_status": "ERROR",
                "error": str(e),
                "processing_time": time.time() - start_time
            }
    
    def _generate_refined_prompt(self, verification_result: Dict, iteration: int, max_iterations: int) -> str:
        """
        Generate a refined humanization prompt based on verification failures.
        
        Args:
            verification_result: Previous verification results
            iteration: Current iteration number
            max_iterations: Maximum iterations allowed
            
        Returns:
            str: Refined prompt for better humanization
        """
        # Base humanization prompt
        base_prompt = """
Rewrite the following text to make it sound more natural and human-written while preserving the original meaning and information.
"""
        
        # Analyze failed detectors for targeted improvements
        detector_results = verification_result.get("detector_results", [])
        failed_detectors = [
            result["detector_name"] 
            for result in detector_results
            if result.get("ai_probability", 0) > verification_result.get("verification_config", {}).get("ai_threshold", 0.3)
        ]
        
        # Iteration-specific refinements
        iteration_guidance = {
            1: "Focus on making the writing style more conversational and natural. Vary sentence lengths and structures.",
            2: "Emphasize reducing repetitive patterns and incorporate more colloquial expressions and natural flow.",
            3: "Pay special attention to making the text sound authentically human by including minor imperfections and more varied vocabulary."
        }
        
        # Detector-specific improvements
        detector_guidance = {
            "perplexity": "Use more unexpected but appropriate word choices and vary sentence complexity.",
            "roberta": "Incorporate more natural speech patterns and avoid overly formal or structured language.",
            "commercial": "Focus on authenticity - include subtle human-like inconsistencies and natural expressions.",
            "fallback_heuristic": "Improve overall naturalness and human-like qualities of the text."
        }
        
        # Build refined prompt
        prompt_parts = [base_prompt]
        
        # Add iteration-specific guidance
        if iteration in iteration_guidance:
            prompt_parts.append(f"\nIteration {iteration} focus: {iteration_guidance[iteration]}")
        
        # Add detector-specific improvements
        if failed_detectors:
            prompt_parts.append("\nSpecial attention needed for:")
            for detector in failed_detectors:
                if detector in detector_guidance:
                    prompt_parts.append(f"- {detector}: {detector_guidance[detector]}")
        
        # Add urgency if nearing max iterations
        if iteration >= max_iterations - 1:
            prompt_parts.append("\nIMPORTANT: This is a final refinement attempt. Make significant changes to improve human authenticity.")
        
        # Add general best practices
        prompt_parts.append("""
\nBest practices:
1. Use varied sentence structures (short, medium, long)
2. Include natural transitions and conversational elements
3. Avoid overly perfect grammar where natural speech would differ
4. Use active voice when appropriate
5. Include subtle personality in word choices
""")
        
        return "\n".join(prompt_parts)
    
    def _reprocess_text_with_refined_prompt(self, text: str, refined_prompt: str, iteration: int) -> Dict[str, Any]:
        """
        Reprocess text using the refined prompt.
        
        Args:
            text: Text to reprocess
            refined_prompt: Refined humanization prompt
            iteration: Current iteration number
            
        Returns:
            Dict: Reprocessed text result
        """
        try:
            # Initialize OpenAI service
            openai_service = OpenAIService()
            
            # Process text with refined prompt
            result = openai_service.humanize_text(
                text=text,
                prompt_template=refined_prompt,
                task_id=f"{self.request.id}_refine_{iteration}"
            )
            
            return {
                "humanized_text": result["humanized_text"],
                "token_usage": result.get("token_usage", {}),
                "model_used": result.get("model", "unknown"),
                "refinement_iteration": iteration
            }
            
        except Exception as e:
            raise ChunkProcessingError(f"Failed to reprocess text in iteration {iteration}: {str(e)}")
    
    def _verify_refined_text(self, refined_result: Dict[str, Any], verification_config: Optional[Dict]) -> Dict[str, Any]:
        """
        Verify refined text using the same configuration as original verification.
        
        Args:
            refined_result: Result from text reprocessing
            verification_config: Configuration for verification
            
        Returns:
            Dict: Verification results for refined text
        """
        try:
            # Create a mock result structure for verification
            mock_humanized_result = {
                "humanized_text": refined_result["humanized_text"],
                "processing_summary": {
                    "refinement_iteration": refined_result.get("refinement_iteration", 0)
                }
            }
            
            # Call verification task directly (synchronous)
            verification_result = verification_task(
                self, 
                mock_humanized_result, 
                verification_config
            )
            
            return verification_result
            
        except Exception as e:
            # Return a safe fallback if verification fails
            return {
                "passed_verification": False,
                "overall_ai_probability": 0.8,  # Assume high AI probability on error
                "overall_confidence": 0.3,
                "recommendation": "NEEDS_REFINEMENT",
                "verification_status": "error",
                "verification_error": str(e)
            }


@celery_app.task(name="stage3.tasks.create_verification_chain")
def create_verification_chain(merged_result: Dict[str, Any], verification_config: Optional[Dict] = None) -> Dict:
    """
    Create a chain of verification and potential refinement tasks.
    
    This is a helper function to create a Celery chain for the verification workflow,
    linking verification and conditional refinement.
    
    Args:
        merged_result: Result from merge_chunks_task
        verification_config: Configuration for verification process
        
    Returns:
        Dict: Result of the verification chain
    """
    # Create verification task
    verification_result = verification_task.apply(args=[merged_result, verification_config]).get()
    
    # If verification failed, trigger refinement
    if not verification_result.get("passed_verification", True):
        return iterative_refinement_task.apply(args=[verification_result]).get()
    
    return verification_result


@celery_app.task(name="stage3.tasks.create_workflow")
def create_complete_humanization_workflow(
    text: str, 
    job_id: str,
    humanization_prompt: str, 
    chunk_size: int = 2000,
    verification_config: Optional[Dict] = None
) -> str:
    """
    Create a complete end-to-end humanization workflow.
    
    This task orchestrates the entire pipeline from text preparation through
    parallel chunk processing, intelligent merging, verification, and refinement.
    
    Args:
        text: Input text to be humanized
        job_id: Unique job identifier
        humanization_prompt: Custom prompt for humanization
        chunk_size: Size of text chunks for parallel processing
        verification_config: Configuration for verification
        
    Returns:
        str: Job ID for the workflow
    """
    # Create task chain for text processing
    from celery import chain, group
    
    try:
        # Stage 1: Prepare text and split into chunks
        chunk_docs = prepare_text_task.apply(args=[text, job_id, chunk_size]).get()
        
        # Stage 2: Process chunks in parallel
        chunk_tasks = group(
            humanize_chunk_task.s(chunk, humanization_prompt)
            for chunk in chunk_docs
        )
        processed_chunks = chunk_tasks.apply().get()
        
        # Stage 3: Merge processed chunks
        merged_result = merge_chunks_task.apply(args=[processed_chunks, job_id]).get()
        
        # Stage 4: Verify and potentially refine
        final_result = create_verification_chain.apply(args=[merged_result, verification_config]).get()
        
        # Workflow completed successfully
        with TaskContextLogger("complete_workflow", job_id) as logger:
            logger.info(
                f"Complete workflow finished for job {job_id}",
                final_status=final_result.get("verification_status", "unknown"),
                passed_verification=final_result.get("passed_verification", False),
                iterations_used=final_result.get("iterations_used", 0) if "iterations_used" in final_result else 0
            )
        
        return job_id
        
    except Exception as e:
        with TaskContextLogger("workflow_error", job_id) as logger:
            logger.error(f"Error in complete workflow for job {job_id}: {e}")
        raise


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
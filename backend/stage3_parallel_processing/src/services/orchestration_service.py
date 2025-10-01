"""
Orchestration service for Stage 3 - Parallel Processing Architecture.

This module provides the main service that orchestrates the parallel processing
of text chunks using Celery's chord pattern (map-reduce). It coordinates the
entire workflow from chunk processing to final verification.
"""

import time
import uuid
from typing import List, Dict, Any, Optional, Union
from celery import chord, chain, group
from celery.result import GroupResult, AsyncResult

from ..core.celery_app import get_celery_app
from ..config.settings import get_settings
from ..utils.logging import setup_logging, TaskContextLogger
from ..tasks.humanization_tasks import (
    humanize_chunk_task,
    merge_chunks_task,
    verification_task
)
from ..utils.error_handling import ChunkProcessingError, ConfigurationError


class OrchestrationService:
    """
    Main orchestration service for parallel text humanization.
    
    This service implements the chord workflow pattern:
    1. Map phase: Distribute chunks to parallel humanize_chunk_task workers
    2. Reduce phase: Aggregate results in merge_chunks_task
    3. Optional chain: Pass results to verification_task
    
    Features:
    - Automatic workflow orchestration
    - Progress tracking and monitoring
    - Error handling and recovery
    - Flexible configuration options
    - Integration with monitoring systems
    """
    
    def __init__(self):
        """Initialize the orchestration service."""
        self.settings = get_settings()
        self.logger = setup_logging(self.__class__.__name__)
        self.celery_app = get_celery_app()
        
        self.logger.info("Orchestration service initialized")
    
    def process_text_parallel(
        self,
        chunks: List[Dict[str, Any]],
        humanization_prompt: str,
        job_id: Optional[str] = None,
        enable_verification: bool = False,
        workflow_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process text chunks in parallel using Celery chord workflow.
        
        This is the main entry point for parallel text processing. It orchestrates
        the entire workflow from chunk distribution to final result assembly.
        
        Args:
            chunks: List of text chunks to process, each containing:
                - id: Unique chunk identifier
                - content: Text content to humanize
                - index: Order index for reassembly
                - metadata: Additional chunk metadata
            humanization_prompt: Prompt template for humanization
            job_id: Optional job identifier for tracking
            enable_verification: Whether to enable Stage 4 verification
            workflow_metadata: Additional metadata for the workflow
            
        Returns:
            Dict containing:
                - job_id: Unique job identifier
                - workflow_type: Type of workflow executed
                - task_ids: Dictionary of task IDs for monitoring
                - chunk_count: Number of chunks being processed
                - estimated_completion_time: Estimated time to completion
                - status: Initial status
                - metadata: Workflow metadata
                
        Raises:
            ChunkProcessingError: For chunk validation failures
            ConfigurationError: For configuration issues
        """
        
        job_id = job_id or f"humanization_{uuid.uuid4().hex[:8]}"
        
        with TaskContextLogger("orchestrate_parallel", job_id) as logger:
            start_time = time.time()
            
            logger.info(
                "Starting parallel text processing workflow",
                job_id=job_id,
                chunk_count=len(chunks),
                enable_verification=enable_verification,
                workflow_metadata=workflow_metadata
            )
            
            # Validate inputs
            self._validate_chunks(chunks)
            self._validate_prompt(humanization_prompt)
            
            # Prepare task metadata
            task_metadata = {
                "job_id": job_id,
                "workflow_start_time": start_time,
                "total_chunks": len(chunks),
                **(workflow_metadata or {})
            }
            
            # Create the chord workflow
            if enable_verification:
                # With verification: chord | verification_task
                workflow_result = self._create_chord_with_verification(
                    chunks, humanization_prompt, task_metadata
                )
                workflow_type = "chord_with_verification"
            else:
                # Without verification: just chord
                workflow_result = self._create_basic_chord(
                    chunks, humanization_prompt, task_metadata
                )
                workflow_type = "basic_chord"
            
            # Extract task IDs for monitoring
            task_ids = self._extract_task_ids(workflow_result, workflow_type)
            
            # Calculate estimated completion time
            estimated_completion_time = self._estimate_completion_time(len(chunks))
            
            result = {
                "job_id": job_id,
                "workflow_type": workflow_type,
                "task_ids": task_ids,
                "chunk_count": len(chunks),
                "estimated_completion_time": estimated_completion_time,
                "status": "started",
                "metadata": {
                    "start_time": start_time,
                    "humanization_prompt_length": len(humanization_prompt),
                    "enable_verification": enable_verification,
                    **task_metadata
                }
            }
            
            logger.info(
                "Parallel processing workflow initiated",
                job_id=job_id,
                workflow_type=workflow_type,
                estimated_completion_time=estimated_completion_time
            )
            
            return result
    
    def _create_basic_chord(
        self,
        chunks: List[Dict[str, Any]],
        humanization_prompt: str,
        task_metadata: Dict[str, Any]
    ) -> AsyncResult:
        """
        Create a basic chord workflow: parallel processing + merge.
        
        Args:
            chunks: List of chunks to process
            humanization_prompt: Prompt for humanization
            task_metadata: Metadata for tasks
            
        Returns:
            AsyncResult: Chord result for monitoring
        """
        
        # Create header group (map phase)
        header_tasks = []
        for chunk in chunks:
            task = humanize_chunk_task.s(
                chunk_data=chunk,
                humanization_prompt=humanization_prompt,
                task_metadata=task_metadata
            )
            header_tasks.append(task)
        
        # Create callback (reduce phase)
        callback = merge_chunks_task.s(
            merge_metadata=task_metadata
        )
        
        # Execute chord
        chord_result = chord(header_tasks)(callback)
        
        return chord_result
    
    def _create_chord_with_verification(
        self,
        chunks: List[Dict[str, Any]],
        humanization_prompt: str,
        task_metadata: Dict[str, Any]
    ) -> AsyncResult:
        """
        Create chord workflow with verification chain.
        
        Args:
            chunks: List of chunks to process
            humanization_prompt: Prompt for humanization
            task_metadata: Metadata for tasks
            
        Returns:
            AsyncResult: Chain result for monitoring
        """
        
        # Create the basic chord
        chord_result = self._create_basic_chord(chunks, humanization_prompt, task_metadata)
        
        # Chain with verification task
        verification_config = {
            "job_id": task_metadata.get("job_id"),
            "verification_enabled": True
        }
        
        chain_result = chain(
            chord_result,
            verification_task.s(verification_config=verification_config)
        )()
        
        return chain_result
    
    def _validate_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Validate chunk data structure and content.
        
        Args:
            chunks: List of chunks to validate
            
        Raises:
            ChunkProcessingError: For validation failures
        """
        if not chunks:
            raise ChunkProcessingError("No chunks provided for processing")
        
        if len(chunks) > 100:  # Reasonable limit for parallel processing
            raise ChunkProcessingError(f"Too many chunks: {len(chunks)} (max: 100)")
        
        for i, chunk in enumerate(chunks):
            if not isinstance(chunk, dict):
                raise ChunkProcessingError(f"Chunk {i} is not a dictionary")
            
            if "content" not in chunk:
                raise ChunkProcessingError(f"Chunk {i} missing 'content' field")
            
            if "index" not in chunk:
                chunk["index"] = i  # Add index if missing
            
            if "id" not in chunk:
                chunk["id"] = f"chunk_{i}"  # Add ID if missing
            
            content = chunk["content"]
            if not content or not content.strip():
                raise ChunkProcessingError(f"Chunk {i} has empty content")
            
            # Validate content length
            if len(content) > 50000:  # Reasonable limit
                raise ChunkProcessingError(f"Chunk {i} too large: {len(content)} characters")
    
    def _validate_prompt(self, prompt: str) -> None:
        """
        Validate humanization prompt.
        
        Args:
            prompt: Prompt to validate
            
        Raises:
            ConfigurationError: For validation failures
        """
        if not prompt or not prompt.strip():
            raise ConfigurationError("Humanization prompt cannot be empty")
        
        if len(prompt) > 10000:  # Reasonable limit
            raise ConfigurationError(f"Prompt too long: {len(prompt)} characters")
    
    def _extract_task_ids(self, workflow_result: AsyncResult, workflow_type: str) -> Dict[str, Any]:
        """
        Extract task IDs from workflow result for monitoring.
        
        Args:
            workflow_result: Result from workflow execution
            workflow_type: Type of workflow
            
        Returns:
            Dict: Task IDs organized by type
        """
        task_ids = {
            "workflow_type": workflow_type,
            "main_task_id": workflow_result.id if workflow_result else None
        }
        
        # For chord workflows, we can extract the group task IDs
        try:
            if hasattr(workflow_result, 'parent') and workflow_result.parent:
                if hasattr(workflow_result.parent, 'children'):
                    task_ids["chunk_task_ids"] = [
                        child.id for child in workflow_result.parent.children
                    ]
                task_ids["group_id"] = workflow_result.parent.id
            
            if workflow_type == "chord_with_verification":
                # For chains, we might have additional task information
                task_ids["has_verification"] = True
        
        except Exception as e:
            self.logger.warning(f"Could not extract detailed task IDs: {e}")
        
        return task_ids
    
    def _estimate_completion_time(self, chunk_count: int) -> float:
        """
        Estimate completion time based on chunk count and historical data.
        
        Args:
            chunk_count: Number of chunks to process
            
        Returns:
            float: Estimated completion time in seconds
        """
        # Base estimates (these could be tuned based on historical performance)
        base_processing_time_per_chunk = 10  # seconds
        parallel_efficiency = 0.7  # 70% efficiency due to overhead
        merge_time = 2  # seconds for merging
        verification_time = 5  # seconds for verification (if enabled)
        
        # Calculate parallel processing time
        worker_count = self.settings.celery.worker_concurrency
        parallel_chunks = min(chunk_count, worker_count)
        sequential_batches = (chunk_count + parallel_chunks - 1) // parallel_chunks
        
        processing_time = (
            sequential_batches * base_processing_time_per_chunk * parallel_efficiency
        )
        
        total_estimated_time = processing_time + merge_time
        
        return total_estimated_time
    
    def get_job_status(self, job_id: str, task_ids: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get the current status of a processing job.
        
        Args:
            job_id: Job identifier
            task_ids: Task IDs from workflow initiation
            
        Returns:
            Dict: Current job status and progress information
        """
        
        with TaskContextLogger("get_job_status", job_id) as logger:
            logger.info("Retrieving job status", job_id=job_id)
            
            try:
                main_task_id = task_ids.get("main_task_id")
                if not main_task_id:
                    return {
                        "job_id": job_id,
                        "status": "unknown",
                        "error": "No main task ID available"
                    }
                
                # Get main task result
                main_result = AsyncResult(main_task_id, app=self.celery_app)
                
                status_info = {
                    "job_id": job_id,
                    "status": main_result.state,
                    "progress": self._calculate_progress(task_ids),
                    "metadata": {
                        "main_task_id": main_task_id,
                        "task_state": main_result.state,
                        "workflow_type": task_ids.get("workflow_type", "unknown")
                    }
                }
                
                # Add result data if completed
                if main_result.ready():
                    if main_result.successful():
                        status_info["result"] = main_result.result
                        status_info["completion_time"] = time.time()
                    else:
                        status_info["error"] = str(main_result.info)
                        status_info["traceback"] = getattr(main_result.info, 'traceback', None)
                
                # Add chunk-level progress if available
                if "chunk_task_ids" in task_ids:
                    chunk_statuses = []
                    for chunk_task_id in task_ids["chunk_task_ids"]:
                        chunk_result = AsyncResult(chunk_task_id, app=self.celery_app)
                        chunk_statuses.append({
                            "task_id": chunk_task_id,
                            "status": chunk_result.state,
                            "ready": chunk_result.ready()
                        })
                    status_info["chunk_progress"] = chunk_statuses
                
                logger.info(
                    "Job status retrieved",
                    job_id=job_id,
                    status=status_info["status"],
                    progress=status_info["progress"]
                )
                
                return status_info
                
            except Exception as e:
                logger.error(f"Error retrieving job status: {e}")
                return {
                    "job_id": job_id,
                    "status": "error",
                    "error": f"Failed to retrieve status: {str(e)}"
                }
    
    def _calculate_progress(self, task_ids: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate job progress based on task states.
        
        Args:
            task_ids: Task IDs dictionary
            
        Returns:
            Dict: Progress information
        """
        progress = {
            "percentage": 0,
            "completed_chunks": 0,
            "total_chunks": 0,
            "stage": "unknown"
        }
        
        try:
            if "chunk_task_ids" in task_ids:
                chunk_task_ids = task_ids["chunk_task_ids"]
                total_chunks = len(chunk_task_ids)
                completed_chunks = 0
                
                for chunk_task_id in chunk_task_ids:
                    chunk_result = AsyncResult(chunk_task_id, app=self.celery_app)
                    if chunk_result.ready():
                        completed_chunks += 1
                
                progress.update({
                    "total_chunks": total_chunks,
                    "completed_chunks": completed_chunks,
                    "percentage": (completed_chunks / total_chunks) * 100 if total_chunks > 0 else 0
                })
                
                # Determine current stage
                if completed_chunks == 0:
                    progress["stage"] = "processing"
                elif completed_chunks == total_chunks:
                    progress["stage"] = "merging"
                else:
                    progress["stage"] = "processing"
        
        except Exception as e:
            self.logger.warning(f"Error calculating progress: {e}")
        
        return progress
    
    def cancel_job(self, job_id: str, task_ids: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cancel a running job and all its associated tasks.
        
        Args:
            job_id: Job identifier
            task_ids: Task IDs from workflow initiation
            
        Returns:
            Dict: Cancellation result
        """
        
        with TaskContextLogger("cancel_job", job_id) as logger:
            logger.info("Cancelling job", job_id=job_id)
            
            cancelled_tasks = []
            errors = []
            
            try:
                # Cancel main task
                main_task_id = task_ids.get("main_task_id")
                if main_task_id:
                    main_result = AsyncResult(main_task_id, app=self.celery_app)
                    main_result.revoke(terminate=True)
                    cancelled_tasks.append(main_task_id)
                
                # Cancel chunk tasks
                if "chunk_task_ids" in task_ids:
                    for chunk_task_id in task_ids["chunk_task_ids"]:
                        try:
                            chunk_result = AsyncResult(chunk_task_id, app=self.celery_app)
                            chunk_result.revoke(terminate=True)
                            cancelled_tasks.append(chunk_task_id)
                        except Exception as e:
                            errors.append(f"Failed to cancel {chunk_task_id}: {str(e)}")
                
                result = {
                    "job_id": job_id,
                    "status": "cancelled",
                    "cancelled_tasks": cancelled_tasks,
                    "cancellation_time": time.time(),
                    "errors": errors
                }
                
                logger.info(
                    "Job cancellation completed",
                    job_id=job_id,
                    cancelled_task_count=len(cancelled_tasks),
                    error_count=len(errors)
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Error during job cancellation: {e}")
                return {
                    "job_id": job_id,
                    "status": "cancellation_failed",
                    "error": str(e),
                    "cancelled_tasks": cancelled_tasks
                }
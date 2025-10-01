"""
Logging utilities for Stage 3 - Parallel Processing Architecture.

This module provides structured logging configuration using structlog
for better observability and monitoring of the parallel processing pipeline.
"""

import logging
import logging.config
import sys
from typing import Dict, Any, Optional
import structlog
from structlog.types import Processor

from ..config.settings import get_settings


def configure_structlog() -> None:
    """Configure structlog with proper processors and formatting."""
    
    settings = get_settings()
    
    # Define processors
    processors = [
        # Add logger name, timestamp, and log level
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="ISO"),
        
        # Add thread/process info for parallel processing
        structlog.processors.add_process_id,
        
        # Stack info processor
        structlog.processors.StackInfoRenderer(),
        
        # Format exception information
        structlog.dev.set_exc_info,
        
        # JSON formatting for production, dev formatting for development
        structlog.processors.JSONRenderer() if settings.environment == "production" 
        else structlog.dev.ConsoleRenderer(colors=True),
    ]
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.monitoring.log_level.upper())
        ),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def setup_logging(name: str, extra_config: Optional[Dict[str, Any]] = None) -> structlog.BoundLogger:
    """
    Setup logging for a module with structured logging.
    
    Args:
        name: Logger name (usually __name__)
        extra_config: Additional configuration options
        
    Returns:
        structlog.BoundLogger: Configured structured logger
    """
    settings = get_settings()
    
    # Configure structlog if not already done
    if not structlog.is_configured():
        configure_structlog()
    
    # Setup standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.monitoring.log_level.upper()),
    )
    
    # Create structured logger
    logger = structlog.get_logger(name)
    
    # Add extra context if provided
    if extra_config:
        logger = logger.bind(**extra_config)
    
    return logger


def setup_celery_logging() -> None:
    """Setup logging configuration specifically for Celery workers."""
    
    settings = get_settings()
    
    # Celery-specific logging configuration
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
                "style": "{",
            },
            "simple": {
                "format": "{levelname} {message}",
                "style": "{",
            },
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s",
            },
        },
        "handlers": {
            "console": {
                "level": settings.monitoring.log_level.upper(),
                "class": "logging.StreamHandler",
                "formatter": "json" if settings.environment == "production" else "verbose",
            },
            "file": {
                "level": "INFO",
                "class": "logging.handlers.RotatingFileHandler",
                "filename": "logs/celery.log",
                "maxBytes": 1024 * 1024 * 50,  # 50MB
                "backupCount": 5,
                "formatter": "json",
            },
        },
        "loggers": {
            "celery": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "celery.worker": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "celery.task": {
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "stage3": {
                "handlers": ["console", "file"],
                "level": settings.monitoring.log_level.upper(),
                "propagate": False,
            },
        },
        "root": {
            "level": settings.monitoring.log_level.upper(),
            "handlers": ["console"],
        },
    }
    
    logging.config.dictConfig(logging_config)


def get_task_logger(task_name: str, task_id: Optional[str] = None) -> structlog.BoundLogger:
    """
    Get a logger specifically configured for Celery tasks.
    
    Args:
        task_name: Name of the task
        task_id: Task ID for correlation
        
    Returns:
        structlog.BoundLogger: Task-specific logger
    """
    logger = setup_logging(f"stage3.tasks.{task_name}")
    
    # Bind task-specific context
    context = {"task_name": task_name}
    if task_id:
        context["task_id"] = task_id
    
    return logger.bind(**context)


def log_task_metrics(
    task_name: str,
    task_id: str,
    duration_seconds: float,
    status: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log task execution metrics for monitoring.
    
    Args:
        task_name: Name of the task
        task_id: Task ID
        duration_seconds: Task execution duration
        status: Task completion status
        metadata: Additional metadata to log
    """
    logger = get_task_logger(task_name, task_id)
    
    log_data = {
        "event": "task_metrics",
        "duration_seconds": duration_seconds,
        "status": status,
    }
    
    if metadata:
        log_data.update(metadata)
    
    logger.info("Task execution metrics", **log_data)


def log_api_call(
    api_name: str,
    endpoint: str,
    status_code: int,
    duration_ms: float,
    task_id: Optional[str] = None,
    error: Optional[str] = None
) -> None:
    """
    Log API call metrics for external service monitoring.
    
    Args:
        api_name: Name of the API (e.g., "openai")
        endpoint: API endpoint called
        status_code: HTTP status code
        duration_ms: Request duration in milliseconds
        task_id: Associated task ID
        error: Error message if any
    """
    logger = setup_logging(f"stage3.api.{api_name}")
    if task_id:
        logger = logger.bind(task_id=task_id)
    
    log_data = {
        "event": "api_call",
        "api_name": api_name,
        "endpoint": endpoint,
        "status_code": status_code,
        "duration_ms": duration_ms,
    }
    
    if error:
        log_data["error"] = error
        logger.error("API call failed", **log_data)
    else:
        logger.info("API call completed", **log_data)


def log_error_with_context(
    logger: structlog.BoundLogger,
    error: Exception,
    context: Dict[str, Any],
    task_id: Optional[str] = None
) -> None:
    """
    Log an error with full context for debugging.
    
    Args:
        logger: Structured logger instance
        error: Exception that occurred
        context: Context information
        task_id: Task ID if applicable
    """
    log_data = {
        "event": "error",
        "error_type": type(error).__name__,
        "error_message": str(error),
        **context
    }
    
    if task_id:
        log_data["task_id"] = task_id
    
    logger.error("Error occurred", **log_data, exc_info=True)


class TaskContextLogger:
    """Context manager for task-specific logging."""
    
    def __init__(self, task_name: str, task_id: str):
        self.task_name = task_name
        self.task_id = task_id
        self.logger = get_task_logger(task_name, task_id)
        self.start_time = None
    
    def __enter__(self) -> structlog.BoundLogger:
        """Enter the logging context."""
        import time
        self.start_time = time.time()
        self.logger.info("Task started")
        return self.logger
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit the logging context and log completion metrics."""
        import time
        duration = time.time() - self.start_time if self.start_time else 0
        
        if exc_type is None:
            self.logger.info("Task completed successfully", duration_seconds=duration)
            log_task_metrics(self.task_name, self.task_id, duration, "SUCCESS")
        else:
            self.logger.error(
                "Task failed",
                duration_seconds=duration,
                error_type=exc_type.__name__,
                error_message=str(exc_val),
                exc_info=True
            )
            log_task_metrics(
                self.task_name, 
                self.task_id, 
                duration, 
                "FAILURE",
                {"error": str(exc_val)}
            )


# Initialize logging on module import
configure_structlog()
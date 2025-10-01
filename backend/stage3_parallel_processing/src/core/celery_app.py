"""
Celery application configuration for Stage 3 - Parallel Processing Architecture.

This module sets up the main Celery application instance with Redis as the message
broker, configures task routing, serialization, monitoring, and error handling.
"""

import os
import logging
from typing import Dict, Any
from celery import Celery
from celery.signals import task_prerun, task_postrun, task_failure, worker_ready

from ..config.settings import get_settings
from ..utils.logging import setup_logging


# Initialize settings
settings = get_settings()

# Setup logging
logger = setup_logging(__name__)


def create_celery_app() -> Celery:
    """
    Create and configure the Celery application.
    
    Returns:
        Celery: Configured Celery application instance
    """
    # Create Celery app
    app = Celery(
        "ai_humanizer_stage3",
        broker=settings.redis.url,
        backend=settings.redis.url,
        include=["src.tasks"]  # Auto-discover tasks
    )
    
    # Update configuration
    app.config_from_object(settings.get_celery_config())
    
    # Additional configuration for error handling and monitoring
    app.conf.update({
        # Error handling
        "task_reject_on_worker_lost": True,
        "task_acks_late": True,
        "worker_disable_rate_limits": True,
        
        # Result backend configuration
        "result_persistent": True,
        "result_compression": "gzip",
        
        # Dead letter queue configuration
        "task_default_retry_delay": settings.celery.task_retry_delay,
        "task_max_retries": settings.celery.task_max_retries,
        
        # Monitoring and events
        "worker_hijack_root_logger": False,
        "worker_log_color": False,
        
        # Security
        "worker_disable_auth": False,
    })
    
    # Setup task signal handlers
    setup_task_signals(app)
    
    return app


def setup_task_signals(app: Celery) -> None:
    """
    Setup Celery signal handlers for monitoring and logging.
    
    Args:
        app: Celery application instance
    """
    
    @task_prerun.connect
    def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **kwds):
        """Handler called before task execution."""
        logger.info(
            f"Starting task {task.name} with ID {task_id}",
            extra={
                "task_id": task_id,
                "task_name": task.name,
                "args": args,
                "kwargs": kwargs,
                "event": "task_start"
            }
        )
    
    @task_postrun.connect
    def task_postrun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, 
                           retval=None, state=None, **kwds):
        """Handler called after task execution."""
        logger.info(
            f"Completed task {task.name} with ID {task_id} - State: {state}",
            extra={
                "task_id": task_id,
                "task_name": task.name,
                "state": state,
                "event": "task_complete"
            }
        )
    
    @task_failure.connect
    def task_failure_handler(sender=None, task_id=None, exception=None, traceback=None, 
                           einfo=None, **kwds):
        """Handler called when task fails."""
        logger.error(
            f"Task {sender.name if sender else 'Unknown'} with ID {task_id} failed: {exception}",
            extra={
                "task_id": task_id,
                "task_name": sender.name if sender else "Unknown",
                "exception": str(exception),
                "traceback": traceback,
                "event": "task_failure"
            }
        )
    
    @worker_ready.connect
    def worker_ready_handler(sender=None, **kwargs):
        """Handler called when worker is ready."""
        logger.info(
            f"Worker {sender.hostname} is ready",
            extra={
                "worker_hostname": sender.hostname,
                "event": "worker_ready"
            }
        )


# Create the global Celery app instance
celery_app = create_celery_app()


def get_celery_app() -> Celery:
    """Get the global Celery application instance."""
    return celery_app


def setup_dead_letter_queue(app: Celery) -> None:
    """
    Setup dead letter queue for failed tasks.
    
    Args:
        app: Celery application instance
    """
    # Configure dead letter queue routing
    app.conf.task_routes.update({
        "stage3.tasks.dead_letter": {"queue": "dead_letter"},
    })
    
    # Setup retry policy for dead letter handling
    app.conf.update({
        "task_retry_policy": {
            "max_retries": settings.celery.task_max_retries,
            "interval_start": settings.celery.task_retry_delay,
            "interval_step": settings.celery.task_retry_delay,
            "interval_max": settings.celery.task_retry_backoff_max,
        }
    })


def configure_queues(app: Celery) -> None:
    """
    Configure Celery queues for different task types.
    
    Args:
        app: Celery application instance
    """
    from kombu import Queue
    
    app.conf.task_default_queue = "default"
    app.conf.task_queues = (
        Queue("default"),
        Queue("humanization", routing_key="humanization"),
        Queue("verification", routing_key="verification"),
        Queue("dead_letter", routing_key="dead_letter"),
        Queue("priority", routing_key="priority"),
    )
    
    # Queue routing
    app.conf.task_routes.update({
        "stage3.tasks.humanize_chunk_task": {"queue": "humanization"},
        "stage3.tasks.merge_chunks_task": {"queue": "humanization"},
        "stage3.tasks.verification_task": {"queue": "verification"},
        "stage3.tasks.dead_letter_task": {"queue": "dead_letter"},
    })


def setup_monitoring(app: Celery) -> None:
    """
    Setup monitoring and metrics collection for Celery.
    
    Args:
        app: Celery application instance
    """
    if settings.monitoring.enable_prometheus:
        try:
            from prometheus_client import Counter, Histogram, Gauge
            
            # Define metrics
            task_counter = Counter(
                "celery_tasks_total",
                "Total number of Celery tasks",
                ["task_name", "state"]
            )
            
            task_duration = Histogram(
                "celery_task_duration_seconds",
                "Task execution duration",
                ["task_name"]
            )
            
            active_tasks = Gauge(
                "celery_active_tasks",
                "Number of active tasks",
                ["worker"]
            )
            
            # Connect metrics to signals
            @task_postrun.connect
            def update_metrics(sender=None, task_id=None, task=None, state=None, **kwargs):
                if task:
                    task_counter.labels(task_name=task.name, state=state or "SUCCESS").inc()
            
            logger.info("Prometheus metrics enabled")
            
        except ImportError:
            logger.warning("Prometheus client not available, metrics disabled")


# Initialize additional configurations
def initialize_celery_app():
    """Initialize Celery application with all configurations."""
    setup_dead_letter_queue(celery_app)
    configure_queues(celery_app)
    setup_monitoring(celery_app)
    
    logger.info(
        f"Celery application initialized - Broker: {settings.redis.url}",
        extra={
            "broker_url": settings.redis.url,
            "result_backend": settings.redis.url,
            "event": "celery_init"
        }
    )


# Initialize on import
initialize_celery_app()

# Export for use in other modules
__all__ = ["celery_app", "get_celery_app", "create_celery_app"]
"""
Stage 3 - Parallel Processing Architecture

This module implements the scalable and resilient parallel processing
infrastructure for the AI Humanizer system using Celery and Redis.
"""

from .core.celery_app import celery_app, get_celery_app
from .services.orchestration_service import OrchestrationService
from .services.monitoring_service import get_monitoring_service
from .config.settings import get_settings

__version__ = "1.0.0"
__author__ = "AI Humanizer Team"

__all__ = [
    "celery_app",
    "get_celery_app", 
    "OrchestrationService",
    "get_monitoring_service",
    "get_settings"
]
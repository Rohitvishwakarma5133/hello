"""
Configuration settings for Stage 3 - Parallel Processing Architecture.

This module provides a comprehensive configuration system using Pydantic Settings
for managing all environment-specific settings including API keys, Redis connection,
Celery configuration, and monitoring settings.
"""

import os
from typing import Optional, Dict, Any, List
from pydantic import BaseSettings, Field, validator
from pydantic_settings import BaseSettings as PydanticBaseSettings


class RedisSettings(BaseSettings):
    """Redis configuration for Celery broker and result backend."""
    
    host: str = Field(default="localhost", description="Redis host")
    port: int = Field(default=6379, description="Redis port")
    db: int = Field(default=0, description="Redis database number")
    password: Optional[str] = Field(default=None, description="Redis password")
    max_connections: int = Field(default=20, description="Maximum Redis connections")
    socket_timeout: float = Field(default=30.0, description="Socket timeout in seconds")
    
    @property
    def url(self) -> str:
        """Generate Redis URL for Celery."""
        auth = f":{self.password}@" if self.password else ""
        return f"redis://{auth}{self.host}:{self.port}/{self.db}"
    
    class Config:
        env_prefix = "REDIS_"


class OpenAISettings(BaseSettings):
    """OpenAI API configuration."""
    
    api_key: str = Field(..., description="OpenAI API key")
    model: str = Field(default="gpt-3.5-turbo", description="Model to use for humanization")
    max_tokens: int = Field(default=2000, description="Maximum tokens per request")
    temperature: float = Field(default=0.8, description="Temperature for text generation")
    timeout: float = Field(default=30.0, description="Request timeout in seconds")
    max_retries: int = Field(default=3, description="Maximum retry attempts")
    
    @validator('api_key')
    def validate_api_key(cls, v):
        if not v or not v.startswith('sk-'):
            raise ValueError('Invalid OpenAI API key format')
        return v
    
    class Config:
        env_prefix = "OPENAI_"


class CelerySettings(BaseSettings):
    """Celery configuration settings."""
    
    # Task routing and execution
    task_serializer: str = Field(default="json", description="Task serialization format")
    accept_content: List[str] = Field(default=["json"], description="Accepted content types")
    result_serializer: str = Field(default="json", description="Result serialization format")
    task_track_started: bool = Field(default=True, description="Track task start events")
    task_time_limit: int = Field(default=300, description="Hard time limit for tasks (seconds)")
    task_soft_time_limit: int = Field(default=240, description="Soft time limit for tasks (seconds)")
    
    # Worker configuration
    worker_prefetch_multiplier: int = Field(default=1, description="Worker prefetch multiplier")
    worker_max_tasks_per_child: int = Field(default=1000, description="Max tasks per worker process")
    worker_concurrency: int = Field(default=4, description="Number of concurrent worker processes")
    
    # Retry configuration
    task_retry_delay: int = Field(default=60, description="Base retry delay (seconds)")
    task_max_retries: int = Field(default=3, description="Maximum retry attempts")
    task_retry_backoff: bool = Field(default=True, description="Enable exponential backoff")
    task_retry_backoff_max: int = Field(default=600, description="Maximum backoff delay (seconds)")
    
    # Monitoring and logging
    worker_send_task_events: bool = Field(default=True, description="Send task events")
    task_send_sent_event: bool = Field(default=True, description="Send task sent events")
    
    class Config:
        env_prefix = "CELERY_"


class MonitoringSettings(BaseSettings):
    """Monitoring and logging configuration."""
    
    log_level: str = Field(default="INFO", description="Logging level")
    enable_prometheus: bool = Field(default=True, description="Enable Prometheus metrics")
    prometheus_port: int = Field(default=8000, description="Prometheus metrics port")
    enable_health_checks: bool = Field(default=True, description="Enable health check endpoints")
    health_check_port: int = Field(default=8001, description="Health check port")
    
    class Config:
        env_prefix = "MONITORING_"


class DatabaseSettings(BaseSettings):
    """MongoDB configuration for persistence (Stage 5)."""
    
    connection_string: str = Field(
        default="mongodb://localhost:27017/ai_humanizer",
        description="MongoDB connection string"
    )
    database_name: str = Field(default="ai_humanizer", description="Database name")
    
    class Config:
        env_prefix = "MONGODB_"


class Settings(PydanticBaseSettings):
    """Main application settings combining all configuration sections."""
    
    # Environment and debug settings
    environment: str = Field(default="development", description="Environment name")
    debug: bool = Field(default=False, description="Debug mode")
    
    # Component settings
    redis: RedisSettings = Field(default_factory=RedisSettings)
    openai: OpenAISettings = Field(default_factory=OpenAISettings)
    celery: CelerySettings = Field(default_factory=CelerySettings)
    monitoring: MonitoringSettings = Field(default_factory=MonitoringSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    
    # Application settings
    app_name: str = Field(default="AI Humanizer - Stage 3", description="Application name")
    version: str = Field(default="1.0.0", description="Application version")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def get_celery_config(self) -> Dict[str, Any]:
        """Generate Celery configuration dictionary."""
        return {
            # Broker and result backend
            "broker_url": self.redis.url,
            "result_backend": self.redis.url,
            
            # Task configuration
            "task_serializer": self.celery.task_serializer,
            "accept_content": self.celery.accept_content,
            "result_serializer": self.celery.result_serializer,
            "task_track_started": self.celery.task_track_started,
            "task_time_limit": self.celery.task_time_limit,
            "task_soft_time_limit": self.celery.task_soft_time_limit,
            
            # Worker configuration
            "worker_prefetch_multiplier": self.celery.worker_prefetch_multiplier,
            "worker_max_tasks_per_child": self.celery.worker_max_tasks_per_child,
            "worker_concurrency": self.celery.worker_concurrency,
            
            # Monitoring
            "worker_send_task_events": self.celery.worker_send_task_events,
            "task_send_sent_event": self.celery.task_send_sent_event,
            
            # Task routing
            "task_routes": {
                "stage3.tasks.*": {"queue": "humanization"},
            },
            
            # Result backend settings
            "result_expires": 3600,  # Results expire after 1 hour
            "result_backend_transport_options": {
                "master_name": "mymaster",
                "visibility_timeout": 300,
            },
        }


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings


def load_settings_from_env() -> Settings:
    """Load fresh settings from environment variables."""
    return Settings()
"""
Monitoring service for Stage 3 - Parallel Processing Architecture.

This module provides comprehensive monitoring capabilities including:
- System health checks
- Performance metrics collection
- Task monitoring
- Service availability checks
- Prometheus metrics integration
"""

import time
import redis
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from celery import Celery
from celery.events.state import State

from ..config.settings import get_settings
from ..utils.logging import setup_logging
from ..services.openai_service import OpenAIService
from ..core.celery_app import get_celery_app


@dataclass
class HealthCheckResult:
    """Health check result data structure."""
    service: str
    status: str  # "healthy", "degraded", "unhealthy", "unknown"
    message: str
    response_time_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: float = time.time()


@dataclass
class SystemMetrics:
    """System performance metrics data structure."""
    active_workers: int
    pending_tasks: int
    completed_tasks_last_hour: int
    failed_tasks_last_hour: int
    average_task_duration_ms: float
    redis_memory_usage_mb: float
    timestamp: float = time.time()


class MonitoringService:
    """
    Comprehensive monitoring service for parallel processing infrastructure.
    
    This service provides:
    - Health checks for all system components
    - Performance metrics collection
    - Service availability monitoring
    - Integration with monitoring systems
    """
    
    def __init__(self):
        """Initialize the monitoring service."""
        self.settings = get_settings()
        self.logger = setup_logging(self.__class__.__name__)
        self.celery_app = get_celery_app()
        
        # Initialize service connections
        self._init_redis_client()
        self._init_openai_service()
        
        self.logger.info("Monitoring service initialized")
    
    def _init_redis_client(self) -> None:
        """Initialize Redis client for monitoring."""
        try:
            self.redis_client = redis.Redis(
                host=self.settings.redis.host,
                port=self.settings.redis.port,
                db=self.settings.redis.db,
                password=self.settings.redis.password,
                socket_timeout=5,  # Short timeout for health checks
                decode_responses=True
            )
            self.redis_client.ping()  # Test connection
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Redis client: {e}")
            self.redis_client = None
    
    def _init_openai_service(self) -> None:
        """Initialize OpenAI service for health checks."""
        try:
            self.openai_service = OpenAIService()
        except Exception as e:
            self.logger.error(f"Failed to initialize OpenAI service: {e}")
            self.openai_service = None
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check of all system components.
        
        Returns:
            Dict: Complete health check results
        """
        start_time = time.time()
        
        self.logger.info("Starting comprehensive health check")
        
        # Individual health checks
        health_results = {
            "redis": self._check_redis_health(),
            "celery": self._check_celery_health(),
            "openai": self._check_openai_health(),
            "system": self._check_system_health()
        }
        
        # Determine overall health status
        overall_status = self._calculate_overall_health(health_results)
        
        # Calculate check duration
        check_duration = (time.time() - start_time) * 1000
        
        result = {
            "overall_status": overall_status,
            "services": {k: asdict(v) for k, v in health_results.items()},
            "check_duration_ms": check_duration,
            "timestamp": time.time(),
            "version": self.settings.version,
            "environment": self.settings.environment
        }
        
        self.logger.info(
            f"Health check completed - Overall status: {overall_status}",
            check_duration_ms=check_duration
        )
        
        return result
    
    def _check_redis_health(self) -> HealthCheckResult:
        """Check Redis health and performance."""
        if not self.redis_client:
            return HealthCheckResult(
                service="redis",
                status="unhealthy",
                message="Redis client not initialized"
            )
        
        start_time = time.time()
        
        try:
            # Test basic operations
            self.redis_client.ping()
            self.redis_client.set("health_check", "test", ex=10)
            test_value = self.redis_client.get("health_check")
            
            if test_value != "test":
                raise Exception("Redis read/write test failed")
            
            # Get Redis info
            info = self.redis_client.info()
            memory_usage = info.get("used_memory", 0) / (1024 * 1024)  # MB
            
            response_time = (time.time() - start_time) * 1000
            
            # Determine status based on response time
            if response_time > 1000:  # > 1 second
                status = "degraded"
                message = f"Redis responding slowly ({response_time:.1f}ms)"
            elif response_time > 500:  # > 500ms
                status = "degraded"
                message = f"Redis response time elevated ({response_time:.1f}ms)"
            else:
                status = "healthy"
                message = "Redis is operational"
            
            return HealthCheckResult(
                service="redis",
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "memory_usage_mb": round(memory_usage, 2),
                    "connected_clients": info.get("connected_clients", 0),
                    "total_commands_processed": info.get("total_commands_processed", 0),
                    "version": info.get("redis_version", "unknown")
                }
            )
            
        except Exception as e:
            return HealthCheckResult(
                service="redis",
                status="unhealthy",
                message=f"Redis health check failed: {str(e)}",
                response_time_ms=(time.time() - start_time) * 1000
            )
    
    def _check_celery_health(self) -> HealthCheckResult:
        """Check Celery workers and broker health."""
        start_time = time.time()
        
        try:
            # Get worker statistics
            inspect = self.celery_app.control.inspect()
            
            # Check active workers
            active_workers = inspect.active()
            if not active_workers:
                return HealthCheckResult(
                    service="celery",
                    status="unhealthy",
                    message="No Celery workers are active"
                )
            
            # Get worker stats
            stats = inspect.stats()
            reserved_tasks = inspect.reserved()
            scheduled_tasks = inspect.scheduled()
            
            # Calculate metrics
            total_workers = len(active_workers)
            total_active_tasks = sum(len(tasks) for tasks in active_workers.values())
            total_reserved_tasks = sum(len(tasks) for tasks in (reserved_tasks or {}).values())
            
            response_time = (time.time() - start_time) * 1000
            
            # Determine status
            if response_time > 5000:  # > 5 seconds
                status = "degraded"
                message = f"Celery inspection slow ({response_time:.1f}ms)"
            elif total_workers == 0:
                status = "unhealthy"
                message = "No active Celery workers"
            else:
                status = "healthy"
                message = f"{total_workers} workers active"
            
            return HealthCheckResult(
                service="celery",
                status=status,
                message=message,
                response_time_ms=response_time,
                details={
                    "active_workers": total_workers,
                    "active_tasks": total_active_tasks,
                    "reserved_tasks": total_reserved_tasks,
                    "worker_details": stats
                }
            )
            
        except Exception as e:
            return HealthCheckResult(
                service="celery",
                status="unhealthy",
                message=f"Celery health check failed: {str(e)}",
                response_time_ms=(time.time() - start_time) * 1000
            )
    
    def _check_openai_health(self) -> HealthCheckResult:
        """Check OpenAI service health."""
        if not self.openai_service:
            return HealthCheckResult(
                service="openai",
                status="unhealthy",
                message="OpenAI service not initialized"
            )
        
        try:
            # Use the built-in health check
            health_result = self.openai_service.health_check()
            
            return HealthCheckResult(
                service="openai",
                status=health_result["status"],
                message=health_result["message"],
                response_time_ms=health_result.get("response_time_ms"),
                details={
                    "model": health_result.get("model"),
                    "error_code": health_result.get("error_code")
                }
            )
            
        except Exception as e:
            return HealthCheckResult(
                service="openai",
                status="unknown",
                message=f"OpenAI health check error: {str(e)}"
            )
    
    def _check_system_health(self) -> HealthCheckResult:
        """Check overall system health and resources."""
        try:
            import psutil
            
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Determine status based on resource usage
            if cpu_percent > 90 or memory.percent > 90 or disk.percent > 95:
                status = "degraded"
                message = "High resource usage detected"
            elif cpu_percent > 70 or memory.percent > 70 or disk.percent > 80:
                status = "degraded"
                message = "Moderate resource usage"
            else:
                status = "healthy"
                message = "System resources normal"
            
            return HealthCheckResult(
                service="system",
                status=status,
                message=message,
                details={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_mb": round(memory.available / (1024 * 1024), 2),
                    "disk_percent": disk.percent,
                    "disk_free_gb": round(disk.free / (1024 * 1024 * 1024), 2)
                }
            )
            
        except ImportError:
            return HealthCheckResult(
                service="system",
                status="unknown",
                message="psutil not available for system monitoring"
            )
        except Exception as e:
            return HealthCheckResult(
                service="system",
                status="unknown",
                message=f"System check failed: {str(e)}"
            )
    
    def _calculate_overall_health(self, health_results: Dict[str, HealthCheckResult]) -> str:
        """Calculate overall health status from individual checks."""
        statuses = [result.status for result in health_results.values()]
        
        if "unhealthy" in statuses:
            return "unhealthy"
        elif "degraded" in statuses:
            return "degraded"
        elif "unknown" in statuses:
            return "degraded"  # Treat unknown as degraded
        else:
            return "healthy"
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Collect comprehensive system metrics.
        
        Returns:
            Dict: System performance metrics
        """
        self.logger.info("Collecting system metrics")
        
        try:
            metrics = {
                "celery_metrics": self._get_celery_metrics(),
                "redis_metrics": self._get_redis_metrics(),
                "task_metrics": self._get_task_metrics(),
                "timestamp": time.time()
            }
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Error collecting metrics: {e}")
            return {
                "error": str(e),
                "timestamp": time.time()
            }
    
    def _get_celery_metrics(self) -> Dict[str, Any]:
        """Get Celery-specific metrics."""
        try:
            inspect = self.celery_app.control.inspect()
            
            active_tasks = inspect.active() or {}
            reserved_tasks = inspect.reserved() or {}
            stats = inspect.stats() or {}
            
            total_active = sum(len(tasks) for tasks in active_tasks.values())
            total_reserved = sum(len(tasks) for tasks in reserved_tasks.values())
            total_workers = len(active_tasks)
            
            return {
                "active_workers": total_workers,
                "active_tasks": total_active,
                "reserved_tasks": total_reserved,
                "worker_stats": stats
            }
            
        except Exception as e:
            self.logger.warning(f"Failed to get Celery metrics: {e}")
            return {"error": str(e)}
    
    def _get_redis_metrics(self) -> Dict[str, Any]:
        """Get Redis-specific metrics."""
        if not self.redis_client:
            return {"error": "Redis client not available"}
        
        try:
            info = self.redis_client.info()
            
            return {
                "memory_usage_mb": round(info.get("used_memory", 0) / (1024 * 1024), 2),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "expired_keys": info.get("expired_keys", 0)
            }
            
        except Exception as e:
            self.logger.warning(f"Failed to get Redis metrics: {e}")
            return {"error": str(e)}
    
    def _get_task_metrics(self) -> Dict[str, Any]:
        """Get task execution metrics from Redis."""
        if not self.redis_client:
            return {"error": "Redis client not available"}
        
        try:
            # These would be populated by task execution logs
            # For now, return placeholder data
            return {
                "completed_tasks_last_hour": 0,
                "failed_tasks_last_hour": 0,
                "average_task_duration_ms": 0.0,
                "note": "Task metrics collection not fully implemented"
            }
            
        except Exception as e:
            self.logger.warning(f"Failed to get task metrics: {e}")
            return {"error": str(e)}
    
    def get_worker_status(self) -> Dict[str, Any]:
        """
        Get detailed Celery worker status information.
        
        Returns:
            Dict: Worker status details
        """
        try:
            inspect = self.celery_app.control.inspect()
            
            return {
                "active_tasks": inspect.active(),
                "reserved_tasks": inspect.reserved(),
                "scheduled_tasks": inspect.scheduled(),
                "worker_stats": inspect.stats(),
                "registered_tasks": inspect.registered(),
                "timestamp": time.time()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting worker status: {e}")
            return {
                "error": str(e),
                "timestamp": time.time()
            }
    
    def shutdown(self) -> None:
        """Cleanup monitoring service resources."""
        self.logger.info("Shutting down monitoring service")
        
        if self.redis_client:
            try:
                self.redis_client.close()
            except Exception as e:
                self.logger.warning(f"Error closing Redis client: {e}")


# Global monitoring service instance
monitoring_service = MonitoringService()


def get_monitoring_service() -> MonitoringService:
    """Get the global monitoring service instance."""
    return monitoring_service
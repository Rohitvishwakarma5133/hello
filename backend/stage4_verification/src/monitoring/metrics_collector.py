"""
Comprehensive monitoring and metrics collection system for Stage 4 verification.

This module provides real-time metrics collection, performance monitoring, and
alerting capabilities for the AI detection and refinement processes.
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from collections import defaultdict, deque
import threading
from abc import ABC, abstractmethod
import json

from ..models.detection_models import DetectionResult, VerificationReport
from ..storage.verification_storage import get_verification_storage

# Configure logging
logger = logging.getLogger(__name__)


@dataclass
class MetricPoint:
    """Represents a single metric data point."""
    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AlertThreshold:
    """Defines alerting thresholds for metrics."""
    metric_name: str
    warning_threshold: float
    critical_threshold: float
    comparison: str = "greater_than"  # greater_than, less_than, equal
    consecutive_breaches: int = 3
    cooldown_minutes: int = 15


class MetricHandler(ABC):
    """Abstract base class for metric handlers."""
    
    @abstractmethod
    def handle_metric(self, metric: MetricPoint) -> None:
        """Handle a single metric point."""
        pass
    
    @abstractmethod
    def handle_alert(self, alert_data: Dict[str, Any]) -> None:
        """Handle alert notifications."""
        pass


class ConsoleMetricHandler(MetricHandler):
    """Simple console-based metric handler for development."""
    
    def handle_metric(self, metric: MetricPoint) -> None:
        logger.info(f"METRIC: {metric.name}={metric.value} tags={metric.tags}")
    
    def handle_alert(self, alert_data: Dict[str, Any]) -> None:
        logger.warning(f"ALERT: {alert_data}")


class FileMetricHandler(MetricHandler):
    """File-based metric handler for persistent storage."""
    
    def __init__(self, log_file: str = "verification_metrics.jsonl"):
        self.log_file = log_file
        self._lock = threading.Lock()
    
    def handle_metric(self, metric: MetricPoint) -> None:
        try:
            with self._lock:
                with open(self.log_file, 'a') as f:
                    metric_data = {
                        "name": metric.name,
                        "value": metric.value,
                        "timestamp": metric.timestamp.isoformat(),
                        "tags": metric.tags,
                        "metadata": metric.metadata
                    }
                    f.write(json.dumps(metric_data) + "\n")
        except Exception as e:
            logger.error(f"Error writing metric to file: {e}")
    
    def handle_alert(self, alert_data: Dict[str, Any]) -> None:
        try:
            with self._lock:
                with open(f"alerts_{self.log_file}", 'a') as f:
                    alert_data["timestamp"] = datetime.utcnow().isoformat()
                    f.write(json.dumps(alert_data) + "\n")
        except Exception as e:
            logger.error(f"Error writing alert to file: {e}")


class VerificationMetricsCollector:
    """
    Comprehensive metrics collector for verification processes.
    
    Tracks performance, success rates, detector effectiveness, and system health
    with real-time alerting and historical analysis capabilities.
    """
    
    def __init__(self, handlers: List[MetricHandler] = None):
        """
        Initialize metrics collector.
        
        Args:
            handlers: List of metric handlers for processing metrics
        """
        self.handlers = handlers or [ConsoleMetricHandler()]
        self.alert_thresholds: Dict[str, AlertThreshold] = {}
        self.alert_state: Dict[str, Dict] = defaultdict(dict)
        
        # Ring buffers for recent metrics (last 1000 points per metric)
        self.recent_metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        
        # Performance tracking
        self.detector_stats: Dict[str, Dict] = defaultdict(lambda: {
            'total_runs': 0,
            'total_time': 0.0,
            'success_count': 0,
            'error_count': 0,
            'last_run': None
        })
        
        # Verification tracking
        self.verification_stats = {
            'total_verifications': 0,
            'passed_verifications': 0,
            'failed_verifications': 0,
            'refinement_attempts': 0,
            'successful_refinements': 0,
            'average_processing_time': 0.0
        }
        
        # Thread safety
        self._lock = threading.Lock()
        
        # Setup default alert thresholds
        self._setup_default_thresholds()
    
    def _setup_default_thresholds(self):
        """Setup default alerting thresholds."""
        default_thresholds = [
            AlertThreshold("verification_pass_rate", 0.5, 0.3, "less_than", 5, 30),
            AlertThreshold("detector_error_rate", 0.1, 0.2, "greater_than", 3, 15),
            AlertThreshold("average_processing_time", 60, 120, "greater_than", 3, 10),
            AlertThreshold("refinement_success_rate", 0.3, 0.1, "less_than", 5, 30),
            AlertThreshold("system_health_score", 0.8, 0.6, "less_than", 2, 20)
        ]
        
        for threshold in default_thresholds:
            self.alert_thresholds[threshold.metric_name] = threshold
    
    def add_alert_threshold(self, threshold: AlertThreshold):
        """Add or update an alert threshold."""
        with self._lock:
            self.alert_thresholds[threshold.metric_name] = threshold
    
    def record_verification_start(self, job_id: str, detectors: List[str], text_length: int):
        """Record the start of a verification process."""
        with self._lock:
            self._emit_metric(
                "verification_started",
                1,
                {"job_id": job_id, "detectors": ",".join(detectors)},
                {"text_length": text_length, "detector_count": len(detectors)}
            )
            self.verification_stats['total_verifications'] += 1
    
    def record_verification_completion(self, job_id: str, passed: bool, processing_time: float,
                                     overall_ai_probability: float, detector_results: List[DetectionResult]):
        """Record completion of a verification process."""
        with self._lock:
            # Update verification stats
            if passed:
                self.verification_stats['passed_verifications'] += 1
            else:
                self.verification_stats['failed_verifications'] += 1
            
            # Update average processing time
            total_verifs = self.verification_stats['total_verifications']
            current_avg = self.verification_stats['average_processing_time']
            self.verification_stats['average_processing_time'] = (
                (current_avg * (total_verifs - 1) + processing_time) / total_verifs
            )
            
            # Emit metrics
            self._emit_metric("verification_completed", 1, {"job_id": job_id, "passed": str(passed)})
            self._emit_metric("verification_processing_time", processing_time, {"job_id": job_id})
            self._emit_metric("overall_ai_probability", overall_ai_probability, {"job_id": job_id})
            
            # Calculate and emit pass rate
            pass_rate = self.verification_stats['passed_verifications'] / total_verifs
            self._emit_metric("verification_pass_rate", pass_rate)
            
            # Emit detector-specific metrics
            for result in detector_results:
                self._emit_detector_metrics(result)
    
    def record_detector_performance(self, detector_name: str, processing_time: float,
                                  success: bool, ai_probability: float, confidence: float):
        """Record individual detector performance metrics."""
        with self._lock:
            stats = self.detector_stats[detector_name]
            stats['total_runs'] += 1
            stats['total_time'] += processing_time
            stats['last_run'] = datetime.utcnow()
            
            if success:
                stats['success_count'] += 1
            else:
                stats['error_count'] += 1
            
            # Calculate and emit derived metrics
            error_rate = stats['error_count'] / stats['total_runs']
            avg_time = stats['total_time'] / stats['total_runs']
            
            self._emit_metric(
                "detector_error_rate",
                error_rate,
                {"detector": detector_name}
            )
            
            self._emit_metric(
                "detector_avg_time",
                avg_time,
                {"detector": detector_name}
            )
            
            self._emit_metric(
                "detector_ai_probability",
                ai_probability,
                {"detector": detector_name}
            )
            
            self._emit_metric(
                "detector_confidence",
                confidence,
                {"detector": detector_name}
            )
    
    def record_refinement_attempt(self, job_id: str, iteration: int, success: bool,
                                improvement: float, processing_time: float):
        """Record refinement iteration metrics."""
        with self._lock:
            self.verification_stats['refinement_attempts'] += 1
            
            if success:
                self.verification_stats['successful_refinements'] += 1
            
            # Calculate refinement success rate
            refinement_success_rate = (
                self.verification_stats['successful_refinements'] / 
                self.verification_stats['refinement_attempts']
            )
            
            self._emit_metric("refinement_attempt", 1, {"job_id": job_id, "iteration": str(iteration)})
            self._emit_metric("refinement_success", 1 if success else 0, {"job_id": job_id})
            self._emit_metric("refinement_improvement", improvement, {"job_id": job_id})
            self._emit_metric("refinement_success_rate", refinement_success_rate)
            self._emit_metric("refinement_processing_time", processing_time, {"job_id": job_id})
    
    def record_system_error(self, error_type: str, component: str, details: str = ""):
        """Record system errors for monitoring."""
        with self._lock:
            self._emit_metric(
                "system_error",
                1,
                {"error_type": error_type, "component": component},
                {"details": details, "timestamp": datetime.utcnow().isoformat()}
            )
    
    def _emit_detector_metrics(self, result: DetectionResult):
        """Emit metrics from a detector result."""
        tags = {"detector": result.detector_name}
        
        self._emit_metric("detector_ai_probability", result.ai_probability, tags)
        self._emit_metric("detector_confidence", result.confidence, tags)
        self._emit_metric("detector_processing_time", result.processing_time, tags)
    
    def _emit_metric(self, name: str, value: float, tags: Dict[str, str] = None, 
                    metadata: Dict[str, Any] = None):
        """Emit a metric to all handlers and check for alerts."""
        metric = MetricPoint(
            name=name,
            value=value,
            timestamp=datetime.utcnow(),
            tags=tags or {},
            metadata=metadata or {}
        )
        
        # Store in recent metrics buffer
        self.recent_metrics[name].append(metric)
        
        # Send to handlers
        for handler in self.handlers:
            try:
                handler.handle_metric(metric)
            except Exception as e:
                logger.error(f"Error in metric handler: {e}")
        
        # Check for alerts
        self._check_alerts(metric)
    
    def _check_alerts(self, metric: MetricPoint):
        """Check if metric triggers any alerts."""
        if metric.name not in self.alert_thresholds:
            return
        
        threshold = self.alert_thresholds[metric.name]
        state = self.alert_state[metric.name]
        
        # Check if threshold is breached
        breached = self._is_threshold_breached(metric.value, threshold)
        
        if breached:
            state['consecutive_breaches'] = state.get('consecutive_breaches', 0) + 1
            state['last_breach'] = datetime.utcnow()
        else:
            state['consecutive_breaches'] = 0
        
        # Trigger alert if conditions are met
        if (state['consecutive_breaches'] >= threshold.consecutive_breaches and
            self._should_send_alert(metric.name, threshold)):
            
            self._trigger_alert(metric, threshold, state)
            state['last_alert'] = datetime.utcnow()
    
    def _is_threshold_breached(self, value: float, threshold: AlertThreshold) -> bool:
        """Check if a value breaches the threshold."""
        if threshold.comparison == "greater_than":
            return value > threshold.warning_threshold
        elif threshold.comparison == "less_than":
            return value < threshold.warning_threshold
        elif threshold.comparison == "equal":
            return value == threshold.warning_threshold
        return False
    
    def _should_send_alert(self, metric_name: str, threshold: AlertThreshold) -> bool:
        """Check if an alert should be sent based on cooldown."""
        state = self.alert_state[metric_name]
        last_alert = state.get('last_alert')
        
        if last_alert is None:
            return True
        
        cooldown_delta = timedelta(minutes=threshold.cooldown_minutes)
        return datetime.utcnow() - last_alert > cooldown_delta
    
    def _trigger_alert(self, metric: MetricPoint, threshold: AlertThreshold, state: Dict):
        """Trigger an alert for the given metric."""
        # Determine severity
        if threshold.comparison == "greater_than":
            severity = "critical" if metric.value > threshold.critical_threshold else "warning"
        elif threshold.comparison == "less_than":
            severity = "critical" if metric.value < threshold.critical_threshold else "warning"
        else:
            severity = "warning"
        
        alert_data = {
            "metric_name": metric.name,
            "current_value": metric.value,
            "threshold": threshold.warning_threshold,
            "critical_threshold": threshold.critical_threshold,
            "severity": severity,
            "consecutive_breaches": state['consecutive_breaches'],
            "tags": metric.tags,
            "metadata": metric.metadata
        }
        
        # Send to handlers
        for handler in self.handlers:
            try:
                handler.handle_alert(alert_data)
            except Exception as e:
                logger.error(f"Error in alert handler: {e}")
    
    def get_system_health_score(self) -> float:
        """Calculate overall system health score (0-1)."""
        with self._lock:
            scores = []
            
            # Verification success rate component
            total_verifs = self.verification_stats['total_verifications']
            if total_verifs > 0:
                pass_rate = self.verification_stats['passed_verifications'] / total_verifs
                scores.append(pass_rate)
            
            # Detector error rate component (inverted)
            detector_error_rates = []
            for stats in self.detector_stats.values():
                if stats['total_runs'] > 0:
                    error_rate = stats['error_count'] / stats['total_runs']
                    detector_error_rates.append(1.0 - error_rate)
            
            if detector_error_rates:
                scores.append(sum(detector_error_rates) / len(detector_error_rates))
            
            # Refinement success rate component
            total_refinements = self.verification_stats['refinement_attempts']
            if total_refinements > 0:
                refinement_rate = self.verification_stats['successful_refinements'] / total_refinements
                scores.append(refinement_rate)
            
            # Processing time component (normalized, lower is better)
            avg_time = self.verification_stats['average_processing_time']
            time_score = max(0, 1 - (avg_time / 300))  # Normalize against 5-minute max
            scores.append(time_score)
            
            # Calculate weighted average
            if scores:
                health_score = sum(scores) / len(scores)
            else:
                health_score = 1.0  # No data yet, assume healthy
            
            # Emit health score as metric
            self._emit_metric("system_health_score", health_score)
            
            return health_score
    
    def get_metrics_summary(self, hours_back: int = 24) -> Dict[str, Any]:
        """Get a summary of recent metrics."""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)
        
        summary = {
            "period_hours": hours_back,
            "verification_stats": self.verification_stats.copy(),
            "detector_performance": {},
            "system_health_score": self.get_system_health_score(),
            "recent_alerts": self._get_recent_alerts(hours_back)
        }
        
        # Add detector performance summaries
        for detector_name, stats in self.detector_stats.items():
            if stats['total_runs'] > 0:
                summary["detector_performance"][detector_name] = {
                    "total_runs": stats['total_runs'],
                    "error_rate": stats['error_count'] / stats['total_runs'],
                    "average_time": stats['total_time'] / stats['total_runs'],
                    "last_run": stats['last_run'].isoformat() if stats['last_run'] else None
                }
        
        return summary
    
    def _get_recent_alerts(self, hours_back: int) -> List[Dict]:
        """Get alerts from the specified time period."""
        # This would typically query a persistent alert store
        # For now, return empty list as alerts are handled by handlers
        return []
    
    def reset_stats(self):
        """Reset all statistics (useful for testing)."""
        with self._lock:
            self.detector_stats.clear()
            self.verification_stats = {
                'total_verifications': 0,
                'passed_verifications': 0,
                'failed_verifications': 0,
                'refinement_attempts': 0,
                'successful_refinements': 0,
                'average_processing_time': 0.0
            }
            self.recent_metrics.clear()
            self.alert_state.clear()


class MonitoringDashboard:
    """
    Simple monitoring dashboard for verification metrics.
    
    Provides methods to display current system status and historical trends.
    """
    
    def __init__(self, metrics_collector: VerificationMetricsCollector):
        self.metrics = metrics_collector
        self.storage = None
        
        # Try to initialize storage for historical data
        try:
            self.storage = get_verification_storage()
        except Exception as e:
            logger.warning(f"Could not initialize storage for dashboard: {e}")
    
    def display_current_status(self) -> Dict[str, Any]:
        """Display current system status."""
        health_score = self.metrics.get_system_health_score()
        summary = self.metrics.get_metrics_summary()
        
        status = {
            "system_health": {
                "score": health_score,
                "status": self._health_status_text(health_score)
            },
            "verification_performance": {
                "total_verifications": summary["verification_stats"]["total_verifications"],
                "pass_rate": (
                    summary["verification_stats"]["passed_verifications"] / 
                    max(summary["verification_stats"]["total_verifications"], 1)
                ),
                "average_processing_time": summary["verification_stats"]["average_processing_time"],
                "refinement_success_rate": (
                    summary["verification_stats"]["successful_refinements"] / 
                    max(summary["verification_stats"]["refinement_attempts"], 1)
                )
            },
            "detector_status": summary["detector_performance"],
            "alerts": summary["recent_alerts"]
        }
        
        return status
    
    def _health_status_text(self, score: float) -> str:
        """Convert health score to text status."""
        if score >= 0.8:
            return "Healthy"
        elif score >= 0.6:
            return "Warning"
        else:
            return "Critical"
    
    def get_historical_trends(self, days_back: int = 7) -> Dict[str, Any]:
        """Get historical performance trends."""
        if not self.storage:
            return {"error": "Storage not available for historical data"}
        
        try:
            analytics = self.storage.get_verification_analytics(days_back)
            return {
                "period_days": days_back,
                "trends": analytics,
                "recommendations": self._generate_recommendations(analytics)
            }
        except Exception as e:
            logger.error(f"Error getting historical trends: {e}")
            return {"error": str(e)}
    
    def _generate_recommendations(self, analytics: Dict[str, Any]) -> List[str]:
        """Generate optimization recommendations based on analytics."""
        recommendations = []
        
        # Check pass rate
        pass_rate = analytics.get("pass_rate", 0)
        if pass_rate < 0.7:
            recommendations.append(
                f"Pass rate is {pass_rate:.1%}. Consider adjusting AI thresholds or improving prompts."
            )
        
        # Check processing time
        avg_time = analytics.get("average_processing_time", 0)
        if avg_time > 60:
            recommendations.append(
                f"Average processing time is {avg_time:.1f}s. Consider optimizing detectors or using parallel execution."
            )
        
        # Check refinement effectiveness
        refinement_stats = analytics.get("refinement_statistics", {})
        refinement_rate = refinement_stats.get("refinement_success_rate", 0)
        if refinement_rate < 0.4:
            recommendations.append(
                f"Refinement success rate is {refinement_rate:.1%}. Review refinement strategies."
            )
        
        return recommendations


# Global metrics collector instance
_metrics_collector = None

def get_metrics_collector(handlers: List[MetricHandler] = None) -> VerificationMetricsCollector:
    """Get or create global metrics collector instance."""
    global _metrics_collector
    
    if _metrics_collector is None:
        _metrics_collector = VerificationMetricsCollector(handlers)
    
    return _metrics_collector


# Decorator for automatic performance monitoring
def monitor_performance(metric_name: str = None, tags: Dict[str, str] = None):
    """Decorator to automatically monitor function performance."""
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            collector = get_metrics_collector()
            name = metric_name or f"{func.__module__}.{func.__name__}"
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                processing_time = time.time() - start_time
                
                collector._emit_metric(
                    f"{name}_duration",
                    processing_time,
                    tags or {},
                    {"function": func.__name__, "success": True}
                )
                
                return result
            except Exception as e:
                processing_time = time.time() - start_time
                
                collector._emit_metric(
                    f"{name}_duration",
                    processing_time,
                    tags or {},
                    {"function": func.__name__, "success": False, "error": str(e)}
                )
                
                collector.record_system_error(
                    error_type=type(e).__name__,
                    component=func.__module__,
                    details=str(e)
                )
                
                raise
        
        return wrapper
    return decorator
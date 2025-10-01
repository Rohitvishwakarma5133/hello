"""
Comprehensive test suite for Stage 4 verification system.

This module contains integration tests, unit tests, and end-to-end tests
for the AI detection and verification pipeline.
"""

import pytest
import asyncio
import time
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../src'))

from models.detection_models import (
    DetectionResult, VerificationReport, VerificationConfig, 
    DetectionRecommendation
)
from services.detector_service import DetectorService
from detectors.perplexity_detector import PerplexityDetector
from detectors.roberta_detector import RoBERTaDetector
from detectors.commercial_detectors import GPTZeroDetector
from storage.verification_storage import VerificationStorage
from monitoring.metrics_collector import (
    VerificationMetricsCollector, MetricPoint, AlertThreshold,
    ConsoleMetricHandler, monitor_performance
)


class TestDetectionModels:
    """Test data models and validation."""
    
    def test_detection_result_creation(self):
        """Test DetectionResult model creation and validation."""
        result = DetectionResult(
            detector_name="test_detector",
            ai_probability=0.7,
            confidence=0.9,
            processing_time=1.2,
            metadata={"test": "value"}
        )
        
        assert result.detector_name == "test_detector"
        assert result.ai_probability == 0.7
        assert result.confidence == 0.9
        assert result.processing_time == 1.2
        assert result.metadata == {"test": "value"}
    
    def test_verification_config_defaults(self):
        """Test VerificationConfig with default values."""
        config = VerificationConfig()
        
        assert config.detectors == ["perplexity", "roberta"]
        assert config.parallel_execution == True
        assert config.timeout == 60
        assert config.ai_threshold == 0.3
        assert config.confidence_threshold == 0.7
    
    def test_verification_report_creation(self):
        """Test VerificationReport creation."""
        detection_results = [
            DetectionResult("detector1", 0.3, 0.8, 1.0),
            DetectionResult("detector2", 0.4, 0.7, 1.5)
        ]
        
        report = VerificationReport(
            detector_results=detection_results,
            overall_ai_probability=0.35,
            overall_confidence=0.75,
            recommendation=DetectionRecommendation.ACCEPT
        )
        
        assert len(report.detector_results) == 2
        assert report.overall_ai_probability == 0.35
        assert report.recommendation == DetectionRecommendation.ACCEPT


class TestPerplexityDetector:
    """Test perplexity-based AI detection."""
    
    @pytest.fixture
    def detector(self):
        """Create a PerplexityDetector instance."""
        return PerplexityDetector()
    
    @pytest.fixture
    def sample_texts(self):
        """Sample texts for testing."""
        return {
            "human_like": "Hey there! I just wanted to share my thoughts on this amazing book I read. It was incredible, and I couldn't put it down. The characters felt so real, you know?",
            "ai_like": "The implementation of artificial intelligence systems requires careful consideration of multiple factors including computational efficiency, accuracy metrics, and scalability parameters.",
            "short": "Hello world!",
            "empty": ""
        }
    
    @pytest.mark.asyncio
    async def test_detect_human_text(self, detector, sample_texts):
        """Test detection of human-like text."""
        result = await detector.detect(sample_texts["human_like"])
        
        assert isinstance(result, DetectionResult)
        assert result.detector_name == "perplexity"
        assert 0 <= result.ai_probability <= 1
        assert 0 <= result.confidence <= 1
        assert result.processing_time > 0
        assert "perplexity_score" in result.metadata
        assert "burstiness_score" in result.metadata
    
    @pytest.mark.asyncio
    async def test_detect_ai_text(self, detector, sample_texts):
        """Test detection of AI-like text."""
        result = await detector.detect(sample_texts["ai_like"])
        
        assert isinstance(result, DetectionResult)
        assert result.ai_probability > 0.3  # Should detect as more AI-like
    
    @pytest.mark.asyncio
    async def test_detect_short_text(self, detector, sample_texts):
        """Test detection with short text."""
        result = await detector.detect(sample_texts["short"])
        
        assert isinstance(result, DetectionResult)
        assert result.confidence < 0.8  # Should have lower confidence
    
    @pytest.mark.asyncio
    async def test_detect_empty_text(self, detector, sample_texts):
        """Test detection with empty text."""
        with pytest.raises(ValueError):
            await detector.detect(sample_texts["empty"])
    
    @pytest.mark.asyncio
    async def test_health_check(self, detector):
        """Test detector health check."""
        is_healthy = await detector.health_check()
        assert isinstance(is_healthy, bool)


class TestRoBERTaDetector:
    """Test RoBERTa-based AI detection."""
    
    @pytest.fixture
    def detector(self):
        """Create a RoBERTaDetector instance."""
        # Use a lightweight model for testing
        return RoBERTaDetector(model_name="distilbert-base-uncased")
    
    @pytest.mark.asyncio
    async def test_detect_functionality(self, detector):
        """Test basic RoBERTa detection functionality."""
        text = "This is a test text for AI detection."
        result = await detector.detect(text)
        
        assert isinstance(result, DetectionResult)
        assert result.detector_name == "roberta"
        assert 0 <= result.ai_probability <= 1
        assert 0 <= result.confidence <= 1
    
    @pytest.mark.asyncio
    async def test_ensemble_detector(self):
        """Test MultiRoBERTaDetector ensemble functionality."""
        from detectors.roberta_detector import MultiRoBERTaDetector
        
        models = ["distilbert-base-uncased"]  # Use lightweight model for testing
        ensemble = MultiRoBERTaDetector(models)
        
        text = "This is a test for ensemble detection."
        result = await ensemble.detect(text)
        
        assert isinstance(result, DetectionResult)
        assert result.detector_name == "multi_roberta"
        assert "ensemble_results" in result.metadata


class TestCommercialDetectors:
    """Test commercial API detector integrations."""
    
    @pytest.fixture
    def mock_detector(self):
        """Create a mock commercial detector."""
        detector = GPTZeroDetector("fake_api_key")
        return detector
    
    @pytest.mark.asyncio
    async def test_gptzero_detector_structure(self, mock_detector):
        """Test GPTZero detector structure and methods."""
        # Test that the detector has required methods
        assert hasattr(mock_detector, 'detect')
        assert hasattr(mock_detector, 'health_check')
        assert mock_detector.detector_name == "gptzero"
    
    @pytest.mark.asyncio
    @patch('aiohttp.ClientSession.post')
    async def test_gptzero_api_call(self, mock_post, mock_detector):
        """Test GPTZero API call with mocked response."""
        # Mock API response
        mock_response = Mock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={
            "documents": [{
                "completely_generated_prob": 0.7,
                "average_generated_prob": 0.65
            }]
        })
        mock_post.return_value.__aenter__.return_value = mock_response
        
        text = "Test text for GPTZero detection."
        
        # This would test the actual API call if implemented
        # For now, we just test the structure
        try:
            result = await mock_detector.detect(text)
            assert isinstance(result, DetectionResult)
        except NotImplementedError:
            # Expected for placeholder implementation
            pass


class TestDetectorService:
    """Test the main detector service orchestration."""
    
    @pytest.fixture
    def detector_service(self):
        """Create a DetectorService instance."""
        return DetectorService()
    
    @pytest.fixture
    def verification_config(self):
        """Create a test verification configuration."""
        return VerificationConfig(
            detectors=["perplexity", "roberta"],
            parallel_execution=True,
            timeout=30,
            ai_threshold=0.3,
            confidence_threshold=0.6
        )
    
    @pytest.mark.asyncio
    async def test_detector_initialization(self, detector_service):
        """Test detector service initialization."""
        assert detector_service.detectors == {}
        assert detector_service.detector_configs == {}
        
        # Test initialization of available detectors
        await detector_service._initialize_detectors(["perplexity"])
        assert "perplexity" in detector_service.detectors
    
    @pytest.mark.asyncio
    async def test_single_detector_verification(self, detector_service, verification_config):
        """Test verification with a single detector."""
        config = VerificationConfig(
            detectors=["perplexity"],
            parallel_execution=False
        )
        
        text = "This is a test text for single detector verification."
        report = await detector_service.verify_text(text, config)
        
        assert isinstance(report, VerificationReport)
        assert len(report.detector_results) == 1
        assert report.detector_results[0].detector_name == "perplexity"
        assert 0 <= report.overall_ai_probability <= 1
        assert 0 <= report.overall_confidence <= 1
        assert report.recommendation in [
            DetectionRecommendation.ACCEPT,
            DetectionRecommendation.REJECT,
            DetectionRecommendation.NEEDS_REFINEMENT
        ]
    
    @pytest.mark.asyncio
    async def test_parallel_detector_verification(self, detector_service, verification_config):
        """Test verification with multiple detectors in parallel."""
        text = "This is a comprehensive test text for parallel detector verification."
        report = await detector_service.verify_text(text, verification_config)
        
        assert isinstance(report, VerificationReport)
        assert len(report.detector_results) >= 1  # At least perplexity should work
        assert all(isinstance(r, DetectionResult) for r in report.detector_results)
    
    @pytest.mark.asyncio
    async def test_detector_timeout_handling(self, detector_service):
        """Test timeout handling for slow detectors."""
        config = VerificationConfig(
            detectors=["perplexity"],
            timeout=0.1  # Very short timeout
        )
        
        text = "Test text for timeout handling."
        
        # The service should handle timeouts gracefully
        report = await detector_service.verify_text(text, config)
        assert isinstance(report, VerificationReport)
    
    @pytest.mark.asyncio
    async def test_health_check_all_detectors(self, detector_service):
        """Test health check for all detectors."""
        await detector_service._initialize_detectors(["perplexity"])
        
        health_status = await detector_service.health_check()
        assert isinstance(health_status, dict)
        assert "perplexity" in health_status


class TestVerificationStorage:
    """Test MongoDB storage functionality."""
    
    @pytest.fixture
    def mock_storage(self):
        """Create a mock storage instance for testing."""
        with patch('pymongo.MongoClient'):
            storage = VerificationStorage("mongodb://test", "test_db")
            
            # Mock collections
            storage.verification_results = Mock()
            storage.refinement_history = Mock()
            storage.detector_performance = Mock()
            storage.job_tracking = Mock()
            
            return storage
    
    def test_store_verification_result(self, mock_storage):
        """Test storing verification results."""
        # Create mock data
        detection_results = [
            DetectionResult("test_detector", 0.3, 0.8, 1.0)
        ]
        report = VerificationReport(
            detector_results=detection_results,
            overall_ai_probability=0.3,
            overall_confidence=0.8,
            recommendation=DetectionRecommendation.ACCEPT
        )
        config = VerificationConfig()
        
        # Mock successful insertion
        mock_storage.verification_results.insert_one.return_value.inserted_id = "test_id"
        
        result_id = mock_storage.store_verification_result(
            "test_job", report, config, 100, 2.5
        )
        
        assert result_id == "test_id"
        mock_storage.verification_results.insert_one.assert_called_once()
    
    def test_store_refinement_attempt(self, mock_storage):
        """Test storing refinement attempt data."""
        refinement_data = {
            "started_at": time.time(),
            "completed_at": time.time(),
            "processing_time": 3.0,
            "previous_ai_probability": 0.7,
            "new_ai_probability": 0.4,
            "improvement": 0.3,
            "passed_verification": True,
            "status": "completed"
        }
        
        mock_storage.refinement_history.insert_one.return_value.inserted_id = "refinement_id"
        
        result_id = mock_storage.store_refinement_attempt(
            "test_job", 1, refinement_data
        )
        
        assert result_id == "refinement_id"
        mock_storage.refinement_history.insert_one.assert_called_once()


class TestMetricsCollector:
    """Test monitoring and metrics collection."""
    
    @pytest.fixture
    def metrics_collector(self):
        """Create a metrics collector for testing."""
        handler = Mock()
        collector = VerificationMetricsCollector([handler])
        return collector, handler
    
    def test_metric_emission(self, metrics_collector):
        """Test basic metric emission."""
        collector, handler = metrics_collector
        
        collector._emit_metric("test_metric", 1.5, {"tag": "value"})
        
        # Check that handler was called
        handler.handle_metric.assert_called_once()
        
        # Check metric was stored in buffer
        assert "test_metric" in collector.recent_metrics
        assert len(collector.recent_metrics["test_metric"]) == 1
    
    def test_verification_metrics_recording(self, metrics_collector):
        """Test recording verification metrics."""
        collector, handler = metrics_collector
        
        # Record verification start
        collector.record_verification_start("job1", ["perplexity"], 100)
        assert collector.verification_stats["total_verifications"] == 1
        
        # Record verification completion
        detector_results = [DetectionResult("perplexity", 0.3, 0.8, 1.0)]
        collector.record_verification_completion(
            "job1", True, 2.5, 0.3, detector_results
        )
        assert collector.verification_stats["passed_verifications"] == 1
        
        # Check metrics were emitted
        assert handler.handle_metric.call_count > 0
    
    def test_alert_threshold_checking(self, metrics_collector):
        """Test alert threshold monitoring."""
        collector, handler = metrics_collector
        
        # Add a test threshold
        threshold = AlertThreshold(
            "test_metric", 
            warning_threshold=5.0,
            critical_threshold=10.0,
            comparison="greater_than",
            consecutive_breaches=1
        )
        collector.add_alert_threshold(threshold)
        
        # Trigger an alert
        collector._emit_metric("test_metric", 6.0)
        
        # Check that alert was triggered
        handler.handle_alert.assert_called_once()
    
    def test_system_health_calculation(self, metrics_collector):
        """Test system health score calculation."""
        collector, handler = metrics_collector
        
        # Add some test data
        collector.verification_stats["total_verifications"] = 10
        collector.verification_stats["passed_verifications"] = 8
        
        health_score = collector.get_system_health_score()
        
        assert 0 <= health_score <= 1
        assert isinstance(health_score, float)
    
    def test_performance_monitoring_decorator(self):
        """Test the performance monitoring decorator."""
        collector = VerificationMetricsCollector([Mock()])
        
        @monitor_performance("test_function")
        def test_function(x, y):
            time.sleep(0.1)  # Simulate processing time
            return x + y
        
        with patch('monitoring.metrics_collector.get_metrics_collector', return_value=collector):
            result = test_function(1, 2)
            
            assert result == 3
            assert "test_function_duration" in collector.recent_metrics


class TestIntegrationWorkflow:
    """Integration tests for complete verification workflow."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_verification(self):
        """Test complete end-to-end verification workflow."""
        # Initialize components
        detector_service = DetectorService()
        config = VerificationConfig(
            detectors=["perplexity"],
            ai_threshold=0.5
        )
        
        # Test text
        test_text = "This is a comprehensive test of the entire verification system."
        
        # Run verification
        report = await detector_service.verify_text(test_text, config)
        
        # Verify results
        assert isinstance(report, VerificationReport)
        assert len(report.detector_results) >= 1
        assert report.recommendation in [
            DetectionRecommendation.ACCEPT,
            DetectionRecommendation.REJECT,
            DetectionRecommendation.NEEDS_REFINEMENT
        ]
    
    def test_workflow_with_storage_and_metrics(self):
        """Test workflow integration with storage and metrics."""
        # Create components with mocking
        with patch('pymongo.MongoClient'):
            storage = VerificationStorage("mongodb://test", "test_db")
            storage.verification_results = Mock()
            storage.verification_results.insert_one.return_value.inserted_id = "test_id"
            
            metrics = VerificationMetricsCollector([Mock()])
            
            # Simulate workflow
            metrics.record_verification_start("job1", ["perplexity"], 100)
            
            # Simulate successful verification
            detection_results = [DetectionResult("perplexity", 0.2, 0.9, 1.5)]
            report = VerificationReport(
                detector_results=detection_results,
                overall_ai_probability=0.2,
                overall_confidence=0.9,
                recommendation=DetectionRecommendation.ACCEPT
            )
            
            # Store results
            result_id = storage.store_verification_result(
                "job1", report, VerificationConfig(), 100, 2.0
            )
            
            # Record metrics
            metrics.record_verification_completion(
                "job1", True, 2.0, 0.2, detection_results
            )
            
            # Verify integration
            assert result_id == "test_id"
            assert metrics.verification_stats["total_verifications"] == 1
            assert metrics.verification_stats["passed_verifications"] == 1


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    @pytest.mark.asyncio
    async def test_detector_initialization_errors(self):
        """Test handling of detector initialization errors."""
        service = DetectorService()
        
        # Try to initialize non-existent detector
        with pytest.raises(ValueError):
            await service._initialize_detectors(["non_existent_detector"])
    
    @pytest.mark.asyncio
    async def test_network_timeout_handling(self):
        """Test handling of network timeouts for commercial detectors."""
        detector = GPTZeroDetector("fake_key")
        
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_post.side_effect = asyncio.TimeoutError("Connection timeout")
            
            # Should handle timeout gracefully
            try:
                result = await detector.detect("test text")
            except (asyncio.TimeoutError, NotImplementedError):
                # Expected for placeholder or timeout
                pass
    
    def test_invalid_configuration_handling(self):
        """Test handling of invalid configurations."""
        with pytest.raises(ValueError):
            VerificationConfig(
                ai_threshold=-0.5  # Invalid threshold
            )
    
    def test_storage_connection_errors(self):
        """Test handling of storage connection errors."""
        with patch('pymongo.MongoClient') as mock_client:
            mock_client.side_effect = Exception("Connection failed")
            
            with pytest.raises(Exception):
                VerificationStorage("mongodb://invalid", "test_db")


# Utility functions for test data generation
def generate_test_texts():
    """Generate various types of test texts."""
    return {
        "human_conversational": [
            "Hey, I just saw this amazing movie! It was so good, I can't even...",
            "Ugh, traffic was terrible today. Took me like an hour to get home.",
            "My cat keeps knocking things off the table. Cats, am I right? 😸",
        ],
        "ai_formal": [
            "The implementation of machine learning algorithms requires careful consideration of multiple variables.",
            "In order to optimize performance metrics, it is essential to evaluate computational efficiency parameters.",
            "The systematic analysis of data structures enables improved algorithmic performance.",
        ],
        "edge_cases": [
            "",  # Empty text
            "Hi.",  # Very short
            "A" * 10000,  # Very long
            "🎉🎈🎊" * 50,  # Mostly emojis
        ]
    }


def create_mock_detection_results(count=3):
    """Create mock detection results for testing."""
    results = []
    for i in range(count):
        results.append(DetectionResult(
            detector_name=f"mock_detector_{i}",
            ai_probability=0.3 + (i * 0.1),
            confidence=0.8 + (i * 0.05),
            processing_time=1.0 + (i * 0.5),
            metadata={"mock": True, "index": i}
        ))
    return results


# Performance benchmarking tests
class TestPerformanceBenchmarks:
    """Performance and load testing for verification system."""
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_detector_performance_benchmark(self):
        """Benchmark detector performance with various text lengths."""
        detector = PerplexityDetector()
        test_texts = {
            "short": "Short text.",
            "medium": "This is a medium length text for testing detector performance. " * 10,
            "long": "This is a longer text for comprehensive performance testing. " * 100
        }
        
        performance_results = {}
        
        for length, text in test_texts.items():
            start_time = time.time()
            result = await detector.detect(text)
            end_time = time.time()
            
            performance_results[length] = {
                "processing_time": end_time - start_time,
                "text_length": len(text),
                "ai_probability": result.ai_probability,
                "confidence": result.confidence
            }
        
        # Assert reasonable performance bounds
        assert performance_results["short"]["processing_time"] < 5.0
        assert performance_results["medium"]["processing_time"] < 10.0
        assert performance_results["long"]["processing_time"] < 30.0
    
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_concurrent_verification_load(self):
        """Test system under concurrent verification load."""
        service = DetectorService()
        config = VerificationConfig(detectors=["perplexity"])
        
        test_texts = [
            f"This is test text number {i} for concurrent load testing."
            for i in range(10)
        ]
        
        # Run concurrent verifications
        tasks = [
            service.verify_text(text, config)
            for text in test_texts
        ]
        
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        # Verify all completed successfully
        successful_results = [r for r in results if isinstance(r, VerificationReport)]
        assert len(successful_results) == len(test_texts)
        
        # Check reasonable total time (should be much less than sequential)
        assert end_time - start_time < 30.0  # Should complete in under 30 seconds


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--disable-warnings",
        "-m", "not slow"  # Skip slow tests by default
    ])
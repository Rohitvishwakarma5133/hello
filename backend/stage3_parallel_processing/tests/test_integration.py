"""
Integration tests for Stage 3 - Parallel Processing Architecture.

These tests demonstrate the end-to-end functionality of the parallel
processing system including task orchestration, error handling, and monitoring.
"""

import pytest
import time
from unittest.mock import Mock, patch, MagicMock

from src.services.orchestration_service import OrchestrationService
from src.services.monitoring_service import MonitoringService
from src.config.settings import Settings


class TestParallelProcessingIntegration:
    """Test the complete parallel processing workflow."""
    
    @pytest.fixture
    def mock_settings(self):
        """Mock settings for testing."""
        settings = Mock(spec=Settings)
        settings.celery.task_max_retries = 3
        settings.celery.worker_concurrency = 2
        settings.openai.api_key = "test_key"
        settings.openai.model = "gpt-3.5-turbo"
        settings.redis.host = "localhost"
        settings.redis.port = 6379
        settings.version = "1.0.0"
        settings.environment = "test"
        return settings
    
    @pytest.fixture
    def sample_chunks(self):
        """Sample text chunks for testing."""
        return [
            {
                "id": "chunk_0",
                "content": "This is the first chunk of text that needs to be humanized.",
                "index": 0,
                "metadata": {"source": "test"}
            },
            {
                "id": "chunk_1", 
                "content": "This is the second chunk of text for processing.",
                "index": 1,
                "metadata": {"source": "test"}
            },
            {
                "id": "chunk_2",
                "content": "This is the final chunk in our test document.",
                "index": 2,
                "metadata": {"source": "test"}
            }
        ]
    
    @pytest.fixture
    def sample_prompt(self):
        """Sample humanization prompt."""
        return "Rewrite the following text to make it more natural and human-like while preserving the original meaning."
    
    @patch('src.config.settings.get_settings')
    @patch('src.core.celery_app.get_celery_app')
    def test_orchestration_service_initialization(self, mock_celery, mock_settings):
        """Test that the orchestration service initializes correctly."""
        mock_settings.return_value = Mock()
        mock_celery.return_value = Mock()
        
        service = OrchestrationService()
        assert service is not None
        assert hasattr(service, 'process_text_parallel')
    
    @patch('src.config.settings.get_settings')
    @patch('src.core.celery_app.get_celery_app')
    def test_chunk_validation(self, mock_celery, mock_settings, sample_chunks, sample_prompt):
        """Test chunk validation in orchestration service."""
        mock_settings.return_value = Mock()
        mock_celery.return_value = Mock()
        
        service = OrchestrationService()
        
        # Valid chunks should not raise
        service._validate_chunks(sample_chunks)
        
        # Empty chunks should raise
        with pytest.raises(Exception):
            service._validate_chunks([])
        
        # Invalid chunk structure should raise
        with pytest.raises(Exception):
            service._validate_chunks([{"invalid": "chunk"}])
    
    @patch('src.config.settings.get_settings')
    @patch('src.core.celery_app.get_celery_app')
    def test_prompt_validation(self, mock_celery, mock_settings, sample_prompt):
        """Test prompt validation in orchestration service."""
        mock_settings.return_value = Mock()
        mock_celery.return_value = Mock()
        
        service = OrchestrationService()
        
        # Valid prompt should not raise
        service._validate_prompt(sample_prompt)
        
        # Empty prompt should raise
        with pytest.raises(Exception):
            service._validate_prompt("")
        
        # Very long prompt should raise
        with pytest.raises(Exception):
            service._validate_prompt("x" * 20000)
    
    @patch('src.config.settings.get_settings')
    @patch('src.core.celery_app.get_celery_app')
    @patch('src.tasks.humanization_tasks.chord')
    def test_workflow_creation(self, mock_chord, mock_celery, mock_settings, sample_chunks, sample_prompt):
        """Test workflow creation and task orchestration."""
        mock_settings.return_value = Mock()
        mock_celery_app = Mock()
        mock_celery.return_value = mock_celery_app
        
        # Mock chord result
        mock_chord_result = Mock()
        mock_chord_result.id = "test_chord_id"
        mock_chord.return_value.return_value = mock_chord_result
        
        service = OrchestrationService()
        service.celery_app = mock_celery_app
        
        result = service.process_text_parallel(
            chunks=sample_chunks,
            humanization_prompt=sample_prompt,
            job_id="test_job_123"
        )
        
        assert result is not None
        assert result["job_id"] == "test_job_123"
        assert result["chunk_count"] == 3
        assert result["workflow_type"] == "basic_chord"
        assert "task_ids" in result
        assert "estimated_completion_time" in result
    
    @patch('src.config.settings.get_settings')
    def test_monitoring_service_initialization(self, mock_settings):
        """Test monitoring service initialization."""
        mock_settings.return_value = Mock()
        
        with patch('src.services.monitoring_service.get_celery_app'), \
             patch('src.services.monitoring_service.redis.Redis'), \
             patch('src.services.monitoring_service.OpenAIService'):
            
            service = MonitoringService()
            assert service is not None
            assert hasattr(service, 'health_check')
    
    def test_health_check_result_structure(self):
        """Test that health check returns proper structure."""
        from src.services.monitoring_service import HealthCheckResult
        
        result = HealthCheckResult(
            service="test",
            status="healthy",
            message="Test service is operational"
        )
        
        assert result.service == "test"
        assert result.status == "healthy"
        assert result.message == "Test service is operational"
        assert result.timestamp > 0


class TestErrorHandling:
    """Test error handling and resilience features."""
    
    def test_error_classification(self):
        """Test error classification functionality."""
        from src.utils.error_handling import classify_api_error, TransientAPIError, PermanentAPIError
        
        # Rate limit should be transient
        error = classify_api_error(429, "Rate limit exceeded")
        assert isinstance(error, TransientAPIError)
        
        # Auth error should be permanent
        error = classify_api_error(401, "Authentication failed")
        assert isinstance(error, PermanentAPIError)
        
        # Server error should be transient
        error = classify_api_error(500, "Internal server error")
        assert isinstance(error, TransientAPIError)
    
    def test_error_handler_utilities(self):
        """Test error handler utility functions."""
        from src.utils.error_handling import ErrorHandler, TransientAPIError, PermanentAPIError
        
        # Should retry transient errors
        transient_error = TransientAPIError("Temporary failure")
        assert ErrorHandler.should_retry(transient_error) == True
        
        # Should not retry permanent errors
        permanent_error = PermanentAPIError("Authentication failed")
        assert ErrorHandler.should_retry(permanent_error) == False
        
        # Retry delay should increase with attempts
        delay1 = ErrorHandler.get_retry_delay(transient_error, 0)
        delay2 = ErrorHandler.get_retry_delay(transient_error, 1)
        assert delay2 > delay1


class TestConfigurationManagement:
    """Test configuration and settings management."""
    
    def test_settings_structure(self):
        """Test that settings have the expected structure."""
        from src.config.settings import Settings
        
        # Test with mock environment variables
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test_key'}):
            settings = Settings()
            
            assert hasattr(settings, 'redis')
            assert hasattr(settings, 'openai')
            assert hasattr(settings, 'celery')
            assert hasattr(settings, 'monitoring')
    
    def test_celery_config_generation(self):
        """Test Celery configuration generation."""
        from src.config.settings import Settings
        
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test_key'}):
            settings = Settings()
            celery_config = settings.get_celery_config()
            
            assert "broker_url" in celery_config
            assert "result_backend" in celery_config
            assert "task_serializer" in celery_config
            assert "task_routes" in celery_config


if __name__ == "__main__":
    # Run basic smoke test
    print("Running Stage 3 integration tests...")
    
    try:
        # Test settings initialization
        from src.config.settings import Settings
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test_key'}):
            settings = Settings()
            print("✓ Settings initialization successful")
        
        # Test error handling
        from src.utils.error_handling import classify_api_error
        error = classify_api_error(429, "Rate limit")
        print("✓ Error handling functional")
        
        print("🎉 Basic smoke tests passed!")
        
    except Exception as e:
        print(f"❌ Smoke tests failed: {e}")
        raise
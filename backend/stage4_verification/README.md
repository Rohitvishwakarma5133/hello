# Stage 4 Verification System

## Overview

The Stage 4 Verification System is a comprehensive AI detection and iterative refinement pipeline designed to ensure that humanized text successfully evades AI detection while maintaining quality and coherence. This system integrates multiple detection methods, provides automated refinement workflows, and includes comprehensive monitoring and analytics.

## Architecture

### Core Components

1. **AI Detector Framework** - Modular system supporting multiple detection methods
2. **Verification Service** - Orchestrates detector execution and result aggregation
3. **Iterative Refinement Engine** - Automatic reprocessing for failed verifications
4. **Storage & Analytics** - MongoDB-based storage with comprehensive analytics
5. **Monitoring System** - Real-time metrics, alerting, and performance tracking

### Key Features

- **Multi-Detector Support**: Perplexity, RoBERTa, commercial APIs (GPTZero, Copyleaks, Sapling)
- **Parallel Processing**: Concurrent detector execution for performance
- **Intelligent Refinement**: Automated prompt optimization based on failure analysis
- **Comprehensive Storage**: Full audit trail and performance analytics
- **Real-time Monitoring**: Metrics collection, alerting, and health monitoring
- **Robust Error Handling**: Graceful degradation and fallback mechanisms

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r backend/stage4_verification/requirements.txt

# Install PyTorch (for RoBERTa detector)
pip install torch transformers

# Install MongoDB dependencies
pip install pymongo motor
```

### Basic Usage

```python
import asyncio
from backend.stage4_verification.src.services.detector_service import DetectorService
from backend.stage4_verification.src.models.detection_models import VerificationConfig

async def verify_text():
    # Initialize detector service
    detector_service = DetectorService()
    
    # Configure verification
    config = VerificationConfig(
        detectors=["perplexity", "roberta"],
        parallel_execution=True,
        ai_threshold=0.3,
        confidence_threshold=0.7
    )
    
    # Verify text
    text = "Your humanized text here..."
    report = await detector_service.verify_text(text, config)
    
    print(f"AI Probability: {report.overall_ai_probability}")
    print(f"Recommendation: {report.recommendation.value}")
    
    return report

# Run verification
asyncio.run(verify_text())
```

### Integration with Stage 3

```python
# In your Celery workflow
from backend.stage3_parallel_processing.src.tasks.humanization_tasks import (
    create_complete_humanization_workflow
)

# Execute complete pipeline with verification
job_id = create_complete_humanization_workflow.delay(
    text="Your input text",
    job_id="unique_job_id",
    humanization_prompt="Your humanization prompt",
    verification_config={
        "detectors": ["perplexity", "roberta"],
        "ai_threshold": 0.3
    }
)
```

## Detector Configuration

### Perplexity Detector

```python
from backend.stage4_verification.src.detectors.perplexity_detector import PerplexityDetector

detector = PerplexityDetector(
    model_name="gpt2",  # GPT-2 model for perplexity calculation
    device="cuda" if torch.cuda.is_available() else "cpu"
)

result = await detector.detect("Text to analyze")
```

### RoBERTa Detector

```python
from backend.stage4_verification.src.detectors.roberta_detector import RoBERTaDetector

detector = RoBERTaDetector(
    model_name="roberta-base-openai-detector",
    use_pipeline=True  # Use HuggingFace pipeline for efficiency
)

# For ensemble detection
from backend.stage4_verification.src.detectors.roberta_detector import MultiRoBERTaDetector

ensemble = MultiRoBERTaDetector([
    "roberta-base-openai-detector",
    "distilbert-base-uncased"
])
```

### Commercial Detectors

```python
from backend.stage4_verification.src.detectors.commercial_detectors import (
    GPTZeroDetector, CopyleaksDetector, SaplingDetector
)

# Configure with API keys
gptzero = GPTZeroDetector(api_key="your_api_key")
copyleaks = CopyleaksDetector(api_key="your_api_key")
sapling = SaplingDetector(api_key="your_api_key")
```

## Verification Configuration

### Basic Configuration

```python
config = VerificationConfig(
    detectors=["perplexity", "roberta"],  # Detectors to use
    parallel_execution=True,              # Run detectors in parallel
    timeout=60,                          # Timeout per detector (seconds)
    ai_threshold=0.3,                    # Threshold for AI detection
    confidence_threshold=0.7             # Minimum confidence required
)
```

### Advanced Configuration

```python
config = VerificationConfig(
    detectors=["perplexity", "roberta", "gptzero"],
    parallel_execution=True,
    timeout=120,
    ai_threshold=0.25,      # Lower threshold = stricter detection
    confidence_threshold=0.8, # Higher confidence required
    detector_configs={      # Per-detector configuration
        "perplexity": {"model_name": "gpt2-medium"},
        "roberta": {"use_pipeline": True},
        "gptzero": {"timeout": 30}
    }
)
```

## Iterative Refinement

The system automatically triggers refinement when verification fails:

```python
# Refinement is automatic in the workflow
final_result = iterative_refinement_task.apply(
    args=[verification_result],
    kwargs={"max_iterations": 3}
)

# Manual refinement configuration
refinement_config = {
    "max_iterations": 3,
    "timeout_per_iteration": 300,
    "improvement_threshold": 0.1  # Minimum improvement required
}
```

### Refinement Strategy

The system uses intelligent prompt refinement based on:

1. **Failed Detector Analysis** - Identifies which detectors failed
2. **Iteration-Specific Guidance** - Progressive refinement strategies
3. **Detector-Specific Improvements** - Targeted fixes for specific detection methods
4. **Urgency Escalation** - More aggressive changes near max iterations

## Storage and Analytics

### MongoDB Collections

1. **verification_results** - Complete verification reports
2. **refinement_history** - Refinement iteration tracking
3. **detector_performance** - Daily performance metrics
4. **job_tracking** - End-to-end job status

### Analytics Queries

```python
from backend.stage4_verification.src.storage.verification_storage import get_verification_storage

storage = get_verification_storage("mongodb://localhost:27017")

# Get comprehensive analytics
analytics = storage.get_verification_analytics(days_back=30)

# Get job history
job_history = storage.get_job_history("job_id")

# Get detector effectiveness
detector_report = storage.get_detector_effectiveness_report(
    "perplexity", days_back=7
)
```

## Monitoring and Metrics

### Real-time Metrics

```python
from backend.stage4_verification.src.monitoring.metrics_collector import (
    get_metrics_collector, FileMetricHandler
)

# Initialize metrics with file handler
metrics = get_metrics_collector([FileMetricHandler("metrics.jsonl")])

# Record custom metrics
metrics.record_verification_start("job1", ["perplexity"], 1000)
metrics.record_verification_completion("job1", True, 2.5, 0.2, detector_results)
```

### Monitoring Dashboard

```python
from backend.stage4_verification.src.monitoring.metrics_collector import MonitoringDashboard

dashboard = MonitoringDashboard(metrics_collector)

# Get current system status
status = dashboard.display_current_status()
print(f"System Health: {status['system_health']['status']}")

# Get historical trends
trends = dashboard.get_historical_trends(days_back=7)
```

### Alert Configuration

```python
from backend.stage4_verification.src.monitoring.metrics_collector import AlertThreshold

# Configure custom alerts
alert = AlertThreshold(
    metric_name="verification_pass_rate",
    warning_threshold=0.7,
    critical_threshold=0.5,
    comparison="less_than",
    consecutive_breaches=3,
    cooldown_minutes=15
)

metrics.add_alert_threshold(alert)
```

## Performance Optimization

### Parallel Execution

```python
# Enable parallel detector execution
config = VerificationConfig(
    detectors=["perplexity", "roberta", "gptzero"],
    parallel_execution=True,  # Run all detectors concurrently
    timeout=60
)
```

### Detector Selection

```python
# Fast configuration (perplexity only)
fast_config = VerificationConfig(
    detectors=["perplexity"],
    timeout=30
)

# Comprehensive configuration (all detectors)
comprehensive_config = VerificationConfig(
    detectors=["perplexity", "roberta", "gptzero", "copyleaks"],
    parallel_execution=True,
    timeout=120
)

# Balanced configuration
balanced_config = VerificationConfig(
    detectors=["perplexity", "roberta"],
    parallel_execution=True,
    timeout=60
)
```

### Caching and Optimization

```python
# Enable model caching for RoBERTa
detector = RoBERTaDetector(
    model_name="roberta-base-openai-detector",
    cache_models=True,  # Cache loaded models
    use_pipeline=True   # Use optimized pipeline
)
```

## Error Handling and Recovery

### Graceful Degradation

The system provides multiple layers of error handling:

1. **Detector Failures** - Continue with remaining detectors
2. **Timeout Handling** - Fail individual detectors, not entire verification
3. **Network Issues** - Retry with exponential backoff
4. **Storage Errors** - Continue processing, log errors separately

### Fallback Mechanisms

```python
# Verification with fallback
try:
    report = await detector_service.verify_text(text, config)
except Exception as e:
    # Fallback to simpler configuration
    fallback_config = VerificationConfig(detectors=["perplexity"])
    report = await detector_service.verify_text(text, fallback_config)
```

## Testing

### Running Tests

```bash
# Run all tests
pytest backend/stage4_verification/tests/

# Run specific test categories
pytest backend/stage4_verification/tests/ -m "not slow"  # Skip performance tests
pytest backend/stage4_verification/tests/ -k "test_detector"  # Only detector tests

# Run with coverage
pytest backend/stage4_verification/tests/ --cov=backend.stage4_verification
```

### Test Categories

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Cross-component workflows
3. **Performance Tests** - Load and performance benchmarks
4. **Error Handling Tests** - Edge cases and failures

## Deployment

### Production Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  stage4-verification:
    build: ./backend/stage4_verification
    environment:
      - MONGODB_URL=mongodb://mongo:27017
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GPTZERO_API_KEY=${GPTZERO_API_KEY}
    depends_on:
      - mongo
      - redis
```

### Environment Variables

```bash
# Required
export MONGODB_URL="mongodb://localhost:27017"
export OPENAI_API_KEY="your-openai-key"

# Optional commercial detectors
export GPTZERO_API_KEY="your-gptzero-key"
export COPYLEAKS_API_KEY="your-copyleaks-key"
export SAPLING_API_KEY="your-sapling-key"

# Performance tuning
export TORCH_THREADS=4
export OMP_NUM_THREADS=4
```

### Scaling Considerations

1. **Horizontal Scaling** - Multiple detector service instances
2. **GPU Acceleration** - CUDA support for transformer models
3. **Model Caching** - Shared model storage for multiple instances
4. **Database Sharding** - MongoDB sharding for high-volume analytics

## API Reference

### DetectorService

```python
class DetectorService:
    async def verify_text(text: str, config: VerificationConfig) -> VerificationReport
    async def health_check() -> Dict[str, bool]
    async def get_available_detectors() -> List[str]
```

### VerificationStorage

```python
class VerificationStorage:
    def store_verification_result(job_id: str, report: VerificationReport, ...) -> str
    def store_refinement_attempt(job_id: str, iteration: int, data: Dict) -> str
    def get_verification_analytics(days_back: int = 30) -> Dict
    def get_job_history(job_id: str) -> Dict
```

### MetricsCollector

```python
class VerificationMetricsCollector:
    def record_verification_start(job_id: str, detectors: List[str], text_length: int)
    def record_verification_completion(job_id: str, passed: bool, ...)
    def get_system_health_score() -> float
    def get_metrics_summary(hours_back: int = 24) -> Dict
```

## Troubleshooting

### Common Issues

1. **Model Download Failures**
   ```bash
   # Pre-download models
   python -c "from transformers import AutoModel; AutoModel.from_pretrained('roberta-base')"
   ```

2. **Memory Issues**
   ```bash
   # Reduce batch size for RoBERTa
   export TRANSFORMERS_CACHE=/path/to/large/disk
   ```

3. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB connection
   python -c "import pymongo; pymongo.MongoClient('mongodb://localhost:27017').admin.command('ping')"
   ```

### Debugging

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable detector debugging
detector = PerplexityDetector(debug=True)
```

### Performance Profiling

```python
import cProfile
import asyncio

async def profile_verification():
    # Your verification code here
    pass

# Profile async code
cProfile.run('asyncio.run(profile_verification())')
```

## Contributing

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd ai-humanizer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r backend/stage4_verification/requirements-dev.txt

# Install pre-commit hooks
pre-commit install
```

### Code Standards

- **Type Hints** - All functions must have type hints
- **Documentation** - Comprehensive docstrings for all public methods
- **Testing** - Minimum 80% test coverage
- **Linting** - Code must pass flake8 and mypy checks

### Adding New Detectors

1. **Create Detector Class**
   ```python
   class CustomDetector(BaseDetector):
       async def detect(self, text: str) -> DetectionResult:
           # Implementation here
           pass
   ```

2. **Register Detector**
   ```python
   # In detector_service.py
   DETECTOR_REGISTRY["custom"] = CustomDetector
   ```

3. **Add Tests**
   ```python
   # In test_verification_system.py
   class TestCustomDetector:
       # Test implementation
       pass
   ```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create GitHub issues for bugs and feature requests
- Check existing documentation and tests
- Monitor system metrics and logs for operational issues
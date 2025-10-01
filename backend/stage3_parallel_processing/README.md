# Stage 3 - Scalable and Resilient Parallel Processing Architecture

A comprehensive parallel processing system built with **Celery** and **Redis** for the AI Humanizer application. This stage implements the distributed task processing infrastructure that enables high-throughput text humanization with robust error handling and monitoring capabilities.

## 🎯 Overview

Stage 3 transforms the AI Humanizer from a sequential processing system into a highly scalable, parallel processing architecture capable of handling multiple text chunks simultaneously. It uses Celery's powerful workflow primitives to orchestrate complex processing pipelines with built-in resilience and monitoring.

### Key Features

- **🔄 Parallel Processing**: Distribute text chunks across multiple workers for concurrent processing
- **🎼 Chord Workflow**: Map-reduce pattern for coordinated parallel execution and result aggregation
- **🔁 Automatic Retries**: Intelligent retry logic with exponential backoff for transient failures
- **📊 Real-time Monitoring**: Comprehensive health checks and performance metrics
- **🚨 Error Handling**: Dead letter queues and detailed error classification
- **⚡ High Performance**: Optimized for throughput and low-latency processing
- **🛡️ Production Ready**: Robust configuration management and logging infrastructure

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Client Request                    │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Orchestration Service                  │
│        (Workflow Coordination & Management)         │
└─────────────────────┬───────────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │     Celery Chord        │
         │    (Map-Reduce)         │
         └─────────┬───────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐    ┌────────┐    ┌────────┐
│Worker 1│    │Worker 2│    │Worker 3│    ... (Parallel)
│ Chunk A│    │ Chunk B│    │ Chunk C│
└────┬───┘    └────┬───┘    └────┬───┘
     │             │             │
     └─────────────┼─────────────┘
                   │
         ┌─────────▼──────────┐
         │   Merge Task       │
         │ (Result Assembly)  │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │ Verification Task  │
         │   (Optional)       │
         └────────────────────┘
```

### Core Components

1. **Orchestration Service**: Coordinates the entire workflow and manages job lifecycle
2. **Celery Tasks**: Individual processing units for chunks, merging, and verification
3. **Redis Broker**: Message queue and result backend for task coordination
4. **Monitoring Service**: Health checks, metrics collection, and system monitoring
5. **Error Handling**: Comprehensive error classification and recovery mechanisms

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Redis Server** (localhost:6379)
- **OpenAI API Key**

### Installation

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit with your settings
   OPENAI_API_KEY=sk-your-openai-key-here
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. **Start Redis Server**
   ```bash
   # Linux/Mac
   redis-server
   
   # Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

4. **Start Celery Workers**
   ```bash
   # Terminal 1: Start worker
   celery -A src.core.celery_app worker --loglevel=info --concurrency=4
   
   # Terminal 2: Start monitoring (optional)
   celery -A src.core.celery_app flower
   ```

5. **Run Demo**
   ```bash
   python demo.py --mode=automated
   ```

## 📖 Usage Examples

### Basic Parallel Processing

```python
from src.services.orchestration_service import OrchestrationService

# Initialize orchestrator
orchestrator = OrchestrationService()

# Define text chunks
chunks = [
    {
        "id": "chunk_1",
        "content": "Your text content here...",
        "index": 0
    },
    {
        "id": "chunk_2", 
        "content": "More text content...",
        "index": 1
    }
]

# Define humanization prompt
prompt = """
Rewrite the following text to make it more natural and human-like
while preserving the original meaning and key information.
"""

# Start parallel processing
result = orchestrator.process_text_parallel(
    chunks=chunks,
    humanization_prompt=prompt,
    job_id="my_job_123",
    enable_verification=True
)

print(f"Job started: {result['job_id']}")
print(f"Estimated completion: {result['estimated_completion_time']}s")
```

### Real-time Job Monitoring

```python
import time
from src.services.orchestration_service import OrchestrationService

orchestrator = OrchestrationService()

# Start job (from previous example)
job_info = orchestrator.process_text_parallel(chunks, prompt)
job_id = job_info['job_id']
task_ids = job_info['task_ids']

# Monitor progress
while True:
    status = orchestrator.get_job_status(job_id, task_ids)
    
    print(f"Status: {status['status']}")
    if 'progress' in status:
        progress = status['progress']
        print(f"Progress: {progress['percentage']:.1f}%")
    
    if status['status'] in ['SUCCESS', 'FAILURE']:
        break
    
    time.sleep(2)

# Get final result
if status['status'] == 'SUCCESS':
    result = status['result']
    print(f"Humanized text: {result['humanized_text']}")
```

### Health Monitoring

```python
from src.services.monitoring_service import get_monitoring_service

monitoring = get_monitoring_service()

# Comprehensive health check
health = monitoring.health_check()
print(f"Overall Status: {health['overall_status']}")

for service, details in health['services'].items():
    print(f"{service}: {details['status']} - {details['message']}")

# System metrics
metrics = monitoring.get_metrics()
celery_metrics = metrics['celery_metrics']
print(f"Active Workers: {celery_metrics['active_workers']}")
print(f"Active Tasks: {celery_metrics['active_tasks']}")
```

## ⚙️ Configuration

### Environment Variables

The system uses environment variables for configuration. Create a `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.8

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Celery Configuration
CELERY_WORKER_CONCURRENCY=4
CELERY_TASK_MAX_RETRIES=3
CELERY_TASK_RETRY_DELAY=60

# Monitoring Configuration
MONITORING_LOG_LEVEL=INFO
MONITORING_PROMETHEUS_PORT=8000

# Application Configuration
ENVIRONMENT=development
DEBUG=false
```

### Advanced Configuration

For advanced use cases, you can customize settings programmatically:

```python
from src.config.settings import Settings

# Create custom settings
settings = Settings(
    openai=OpenAISettings(
        model="gpt-4",
        temperature=0.9,
        max_tokens=3000
    ),
    celery=CelerySettings(
        worker_concurrency=8,
        task_max_retries=5
    )
)

# Use with services
orchestrator = OrchestrationService()
orchestrator.settings = settings
```

## 🔧 Development

### Project Structure

```
backend/stage3_parallel_processing/
├── src/
│   ├── core/
│   │   └── celery_app.py          # Celery application configuration
│   ├── config/
│   │   └── settings.py            # Configuration management
│   ├── services/
│   │   ├── orchestration_service.py # Main workflow orchestration
│   │   ├── monitoring_service.py   # Health checks and metrics
│   │   └── openai_service.py      # OpenAI API integration
│   ├── tasks/
│   │   └── humanization_tasks.py  # Celery task definitions
│   └── utils/
│       ├── logging.py             # Structured logging
│       └── error_handling.py      # Error classification
├── tests/
│   └── test_integration.py        # Integration tests
├── demo.py                        # Interactive demo script
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_integration.py::TestParallelProcessingIntegration -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html
```

### Development Workflow

1. **Start Development Environment**
   ```bash
   # Terminal 1: Redis
   redis-server
   
   # Terminal 2: Celery Worker
   celery -A src.core.celery_app worker --loglevel=debug --reload
   
   # Terminal 3: Monitoring
   celery -A src.core.celery_app flower --port=5555
   ```

2. **Run Tests**
   ```bash
   python -m pytest tests/ -v
   ```

3. **Demo & Debug**
   ```bash
   python demo.py --mode=interactive
   ```

## 📊 Monitoring & Operations

### Health Checks

The system provides comprehensive health monitoring:

```bash
# Quick health check
python demo.py --mode=health

# Monitoring dashboard
python demo.py --mode=monitoring
```

Health check endpoints cover:
- **Redis**: Connection, memory usage, response times
- **Celery**: Worker status, task queues, processing capacity
- **OpenAI**: API connectivity, authentication, rate limits
- **System**: CPU, memory, disk usage

### Performance Metrics

Key performance indicators tracked:

- **Throughput**: Tasks processed per minute
- **Latency**: Average task completion time
- **Error Rate**: Failed tasks percentage
- **Resource Usage**: CPU, memory, network utilization
- **Queue Depth**: Pending tasks in queues

### Logging

Structured logging with correlation IDs:

```python
# Logs include contextual information
{
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "INFO",
    "logger": "stage3.tasks.humanize_chunk",
    "message": "Chunk processed successfully",
    "task_id": "abc123-def456",
    "chunk_id": "chunk_0",
    "processing_time": 2.35,
    "tokens_used": 150
}
```

## 🚨 Error Handling

### Error Classification

The system classifies errors into categories for appropriate handling:

1. **Transient Errors** (Automatic Retry)
   - Network timeouts
   - Rate limiting (429)
   - Server errors (5xx)
   - Temporary service unavailability

2. **Permanent Errors** (No Retry)
   - Authentication failures (401/403)
   - Invalid API requests (400)
   - Content policy violations
   - Malformed input data

3. **Dead Letter Queue**
   - Tasks that exhaust all retries
   - Systematic failures requiring investigation
   - Manual recovery and analysis

### Retry Strategy

Automatic retries with exponential backoff:

```python
# Configuration example
CELERY_TASK_RETRY_DELAY = 60        # Base delay: 1 minute
CELERY_TASK_MAX_RETRIES = 3         # Maximum attempts
CELERY_RETRY_BACKOFF = True         # Enable exponential backoff
CELERY_RETRY_BACKOFF_MAX = 600      # Maximum delay: 10 minutes
```

Retry schedule: 1m → 2m → 4m → Dead Letter Queue

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Restart Redis
   sudo service redis restart
   ```

2. **No Celery Workers**
   ```bash
   # Check worker status
   celery -A src.core.celery_app status
   
   # Start worker
   celery -A src.core.celery_app worker --loglevel=info
   ```

3. **OpenAI API Errors**
   ```bash
   # Verify API key
   export OPENAI_API_KEY="your-key-here"
   
   # Test API connection
   python demo.py --mode=health
   ```

4. **High Memory Usage**
   ```bash
   # Monitor Redis memory
   redis-cli info memory
   
   # Reduce worker concurrency
   celery -A src.core.celery_app worker --concurrency=2
   ```

### Debug Mode

Enable detailed logging:

```python
# In settings or environment
DEBUG = True
MONITORING_LOG_LEVEL = "DEBUG"

# Or run with debug logging
python demo.py --mode=automated --debug
```

## 📈 Performance Optimization

### Scaling Guidelines

1. **Horizontal Scaling**
   ```bash
   # Add more worker processes
   celery -A src.core.celery_app worker --concurrency=8
   
   # Multiple worker machines
   celery -A src.core.celery_app worker --hostname=worker1@%h
   celery -A src.core.celery_app worker --hostname=worker2@%h
   ```

2. **Vertical Scaling**
   ```bash
   # Increase Redis memory
   redis-server --maxmemory 2gb
   
   # Optimize worker configuration
   export CELERY_WORKER_PREFETCH_MULTIPLIER=1
   export CELERY_WORKER_MAX_TASKS_PER_CHILD=1000
   ```

3. **Queue Optimization**
   - Use dedicated queues for different task types
   - Implement priority queues for urgent tasks
   - Configure appropriate routing strategies

### Performance Tuning

Key configuration parameters:

```python
# High-throughput configuration
CELERY_WORKER_CONCURRENCY = 8
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_COMPRESSION = "gzip"
REDIS_MAX_CONNECTIONS = 50

# Low-latency configuration
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_TASK_STORE_EAGER_RESULT = True
REDIS_SOCKET_TIMEOUT = 5.0
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY demo.py .

CMD ["celery", "-A", "src.core.celery_app", "worker", "--loglevel=info"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    
  worker:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_HOST=redis
    depends_on:
      - redis
    deploy:
      replicas: 3
    
  monitoring:
    build: .
    command: celery -A src.core.celery_app flower --port=5555
    ports:
      - "5555:5555"
    depends_on:
      - redis
```

### Production Deployment

1. **Environment Setup**
   ```bash
   # Production environment variables
   ENVIRONMENT=production
   DEBUG=false
   REDIS_HOST=your-redis-cluster
   OPENAI_API_KEY=your-production-key
   ```

2. **Process Management**
   ```bash
   # Use supervisor or systemd for process management
   [program:celery-worker]
   command=celery -A src.core.celery_app worker --loglevel=info
   directory=/app
   user=celery
   numprocs=4
   autostart=true
   autorestart=true
   ```

3. **Monitoring & Alerting**
   - Configure Prometheus metrics collection
   - Set up Grafana dashboards
   - Implement health check endpoints
   - Configure alerting for critical failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Update documentation
6. Submit a pull request

### Development Guidelines

- Follow PEP 8 style guidelines
- Add type hints for all functions
- Include comprehensive docstrings
- Write tests for new functionality
- Update documentation for changes

## 📄 License

This project is part of the AI Humanizer application and follows the project's licensing terms.

## 🔗 Related Documentation

- [Stage 1 - Preprocessing & Chunking](../stage1_preprocessing/README.md)
- [Stage 2 - Prompt Engineering](../stage2_prompt_engineering/README.md)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Redis Documentation](https://redis.io/documentation)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Stage 3 Implementation Status**: ✅ **Complete**

This stage provides a production-ready parallel processing architecture that can handle high-volume text humanization workloads with excellent reliability and performance characteristics.
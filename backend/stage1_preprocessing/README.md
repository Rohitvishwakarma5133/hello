# Semantic Text Chunking System

A sophisticated text chunking system for the AI Humanizer application that intelligently splits text into semantically coherent chunks while maintaining context through overlapping segments.

## 🎯 Overview

This system implements the **Stage 1.2 - Semantic Text Chunking** requirements with a hybrid approach that balances performance with quality:

- **Default Mode**: Fast recursive character splitting for all users
- **Personal Touch Mode**: Hybrid approach with semantic validation for premium users
- **Smart Configuration**: Automatic optimization based on text length and user tier
- **Overlap Management**: Maintains context continuity between chunks
- **Fallback Handling**: Robust error handling with graceful degradation

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│              TextChunker                │  ← Simple Facade
│                 (API)                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           ChunkingService               │  ← Orchestration
└─────────────────┬───────────────────────┘
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
    ┌─────────┐ ┌───────┐ ┌─────────┐
    │Recursive│ │Semantic│ │ Hybrid  │      ← Strategies
    │Strategy │ │Strategy│ │Strategy │
    └─────────┘ └───────┘ └─────────┘
                    │
            ┌───────▼───────┐
            │ EmbeddingService│              ← Semantic Analysis
            └─────────────────┘
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { TextChunker } from './src/index';

const chunker = new TextChunker();

// Default chunking for regular users
const result = await chunker.chunk(text, {
  userId: 'user123',
  isPremium: false,
  mode: 'default',
  maxTokens: 500
});

console.log(`Created ${result.chunkCount} chunks using ${result.strategy}`);
```

### Premium Features

```typescript
// Premium chunking with semantic validation
const premiumResult = await chunker.chunk(text, {
  userId: 'premium456',
  isPremium: true,
  mode: 'personal-touch',
  maxTokens: 400,
  overlapPercentage: 20
});

// Chunks will have semantic scores and better boundaries
premiumResult.chunks.forEach(chunk => {
  console.log(`Semantic Score: ${chunk.metadata?.semanticScore}`);
});
```

## 📊 Chunking Strategies

### 1. Recursive Character Splitting (Default)

**When**: Default mode for all users, fallback for premium users
**How**: Hierarchical splitting using separators: `['\\n\\n', '\\n', '. ', ' ']`
**Benefits**: Fast, reliable, maintains document structure

```typescript
// Configuration example
{
  maxTokens: 500,
  overlapPercentage: 15,
  separators: ['\\n\\n', '\\n', '. ', ' ']
}
```

### 2. Semantic Chunking (Premium)

**When**: Pure semantic mode (can be used directly)
**How**: Vector embeddings + cosine distance analysis
**Benefits**: Semantically coherent chunks, topic-aware boundaries

```typescript
// Analyzes semantic similarity between sentences
const similarity = embeddingService.calculateCosineSimilarity(
  embedding1, 
  embedding2
);
```

### 3. Hybrid Chunking (Premium Personal Touch)

**When**: Premium users with "personal-touch" mode selected
**How**: Recursive splitting + semantic boundary validation
**Benefits**: Speed of recursive + intelligence of semantic analysis

```typescript
// Process:
// 1. Fast recursive chunking
// 2. Semantic boundary analysis  
// 3. Merge chunks with poor boundaries
// 4. Apply overlap
```

## ⚙️ Configuration

### Automatic Configuration

The system automatically selects optimal settings based on:

- **Text Length**: Small/medium/large document configs
- **User Tier**: Premium vs regular user features
- **Mode Selection**: Default vs personal-touch
- **Content Type**: Future: document-specific optimizations

### Manual Override

```typescript
import { ChunkingService, ChunkingConfigFactory } from './src/index';

const service = new ChunkingService();
const customConfig = {
  maxTokens: 300,
  overlapPercentage: 25,
  semanticThreshold: 0.2
};

const result = await service.process(text, userContext, customConfig);
```

### Configuration Presets

| Preset | Max Tokens | Overlap % | Use Case |
|--------|------------|-----------|----------|
| Small Document | 250 | 25% | Short texts |
| Default | 500 | 15% | Regular content |
| Personal Touch | 400 | 20% | Premium quality |
| Large Document | 800 | 10% | Long documents |

## 🔬 Semantic Analysis

### Mock Embedding Service (Development)

For development and testing, includes a sophisticated mock embedding service that simulates semantic relationships:

- **Topic Detection**: Identifies technical, business, academic, creative content
- **Structural Analysis**: Word count, sentence complexity, readability
- **Similarity Calculation**: Cosine similarity/distance between embeddings
- **Caching**: Efficient embedding reuse

### Production Integration

For production, replace with real embedding services:

```typescript
import { OpenAIEmbeddingService } from './services/openai-embedding';
import { CohereEmbeddingService } from './services/cohere-embedding';

const embeddingService = new OpenAIEmbeddingService({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-ada-002'
});

const strategy = new SemanticChunkingStrategy(embeddingService);
```

## 📈 Performance Features

### Optimization Techniques

1. **Batched Processing**: Embeddings processed in configurable batches
2. **Caching**: Embedding results cached for repeated content
3. **Early Termination**: Smart thresholds prevent excessive processing
4. **Fallback Handling**: Graceful degradation on errors
5. **Lazy Loading**: Semantic analysis only for premium users

### Performance Metrics

```typescript
const result = await chunker.chunk(text, options);

console.log(`Processing Time: ${result.processingTimeMs}ms`);
console.log(`Chunks Created: ${result.chunkCount}`);
console.log(`Total Tokens: ${result.totalTokens}`);
console.log(`Strategy Used: ${result.strategy}`);
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="RecursiveChunkingStrategy"

# Run with coverage
npm test -- --coverage
```

### Test Categories

- **Unit Tests**: Individual components and utilities
- **Integration Tests**: Strategy combinations and service integration
- **Performance Tests**: Large document handling and timing
- **Edge Cases**: Special characters, multilingual content, malformed input

### Demo Script

```bash
# Run the interactive demo
npx ts-node demo.ts
```

The demo shows:
- Default vs premium chunking comparison
- Performance metrics
- Semantic scoring
- Different text types

## 🛠️ Implementation Details

### Key Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `TextChunker` | Simple API facade | `chunk()` |
| `ChunkingService` | Strategy orchestration | `process()` |
| `RecursiveChunkingStrategy` | Default splitting | `chunk()`, `validateChunk()` |
| `SemanticChunkingStrategy` | Semantic analysis | `chunk()`, `analyzeChunkQuality()` |
| `HybridChunkingStrategy` | Combined approach | `chunk()`, `analyzeHybridPerformance()` |
| `MockEmbeddingService` | Development embeddings | `generateEmbedding()`, `calculateCosineSimilarity()` |
| `TextUtils` | Utility functions | `countTokens()`, `addOverlap()` |

### Data Structures

```typescript
interface TextChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  metadata?: {
    semanticScore?: number;
    boundaryType?: 'paragraph' | 'sentence' | 'word' | 'semantic';
    overlapStart?: number;
    overlapEnd?: number;
  };
}
```

## 📋 User Experience Flow

### Default Users

```
Text Input → RecursiveChunkingStrategy → Add Overlap → Return Chunks
```

- Fast processing (< 50ms typical)
- Reliable structural boundaries
- 15% default overlap

### Premium Users (Personal Touch)

```
Text Input → RecursiveChunkingStrategy → Semantic Validation → 
Boundary Analysis → Merge Poor Boundaries → Add Overlap → Return Chunks
```

- Enhanced processing (200-500ms typical)
- Semantically aware boundaries
- 20% default overlap
- Quality metrics and recommendations

## 🔒 Error Handling

### Graceful Degradation

1. **Semantic Processing Fails**: Falls back to recursive chunking
2. **Embedding Service Unavailable**: Uses recursive strategy
3. **Invalid Input**: Returns empty array with warning
4. **Memory Constraints**: Processes in smaller batches
5. **Timeout**: Returns partial results with status

### Monitoring Points

```typescript
// Service health check
const embeddingService = new MockEmbeddingService();
const isHealthy = await embeddingService.healthCheck();

// Performance monitoring
if (result.processingTimeMs > 5000) {
  console.warn('Slow chunking performance detected');
}
```

## 🚀 Deployment Considerations

### Production Checklist

- [ ] Replace MockEmbeddingService with production service
- [ ] Configure proper embedding API keys
- [ ] Set up caching layer (Redis recommended)
- [ ] Monitor processing times and set alerts
- [ ] Configure batch sizes based on API limits
- [ ] Set up fallback handling for API failures

### Scaling

- **Horizontal**: Process chunks in parallel workers
- **Vertical**: Optimize embedding batch sizes
- **Caching**: Cache embeddings at multiple levels
- **CDN**: Cache common chunks for repeated content

## 📊 Analytics and Monitoring

### Key Metrics

- Processing time by strategy
- Chunk count distributions
- Semantic score distributions
- Error rates and fallback frequency
- User tier usage patterns

### Quality Metrics

```typescript
// Available for semantic strategies
const analysis = await strategy.analyzeChunkQuality(chunks);
console.log(analysis.boundaryQuality); // 'excellent' | 'good' | 'fair' | 'poor'
```

## 🔮 Future Enhancements

### Planned Features

1. **Document-Specific Chunking**: Markdown, HTML, code-aware splitting
2. **Multi-language Support**: Language-specific boundary detection
3. **Topic Modeling**: Advanced semantic clustering
4. **User Learning**: Adapt to user preferences over time
5. **Real-time Processing**: Streaming chunk generation

### Extension Points

- Custom embedding services
- Additional chunking strategies
- Domain-specific configurations
- External quality metrics

## 📝 License

This chunking system is part of the AI Humanizer application and follows the project's licensing terms.

---

**Note**: This implementation provides a solid foundation for semantic text chunking with clear separation between free and premium features, robust error handling, and excellent performance characteristics.
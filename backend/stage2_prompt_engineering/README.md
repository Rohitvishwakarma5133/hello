# Stage 2.1: Dynamic and Layered Prompt Engineering for Evasion

A sophisticated prompt engineering system that implements multi-layered, context-aware prompts designed to evade AI detection by maximizing text perplexity and burstiness while maintaining semantic integrity.

## 🎯 Overview

This system implements the **Stage 2.1** requirements for the AI Humanizer backend, providing:

- **Dynamic Prompt Selection**: Automatically chooses optimal prompts based on user tier, content type, and text characteristics
- **Layered Architecture**: Multi-layer prompt structure (System/Context/Constraints/Reasoning/Critique)
- **Advanced Reasoning Patterns**: Chain-of-Thought, Self-Consistency, and Self-Critique for premium users
- **Content-Aware Adaptation**: Specialized prompts for academic, business, creative, and technical content
- **User Tier Differentiation**: Enhanced features for premium users with personal-touch mode

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│              TextHumanizer              │  ← Simple Facade
│                 (API)                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         HumanizationService            │  ← Main Orchestrator  
└─────────────────┬───────────────────────┘
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
    ┌─────────┐ ┌───────┐ ┌─────────┐
    │Dynamic  │ │ LLM   │ │Advanced │
    │Prompt   │ │Service│ │Reasoning│       ← Core Components
    │Generator│ │       │ │Manager  │
    └─────────┘ └───────┘ └─────────┘
          │
    ┌─────▼─────┐
    │ Template  │                         ← Prompt Templates
    │ Factory   │
    └───────────┘
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { TextHumanizer } from './src/index';

const humanizer = new TextHumanizer('development');

// Create text chunks (usually from Stage 1 chunking)
const chunks = [{
  id: 'chunk_1',
  content: 'Your AI-generated text here...',
  startIndex: 0,
  endIndex: 100,
  tokenCount: 25
}];

// Humanize for default user
const result = await humanizer.humanize(chunks, {
  userId: 'user123',
  isPremium: false,
  textType: 'business',
  humanizationLevel: 'moderate'
});

console.log(result.processedChunks[0].humanizedContent);
```

### Premium Features

```typescript
// Premium user with advanced reasoning
const premiumResult = await humanizer.humanize(chunks, {
  userId: 'premium456',
  isPremium: true,
  mode: 'personal-touch',
  textType: 'academic',
  humanizationLevel: 'aggressive',
  enableAdvancedReasoning: true,
  enableSelfCritique: true
});

console.log(`Quality Score: ${premiumResult.quality.qualityScore}`);
console.log(`Perplexity: ${premiumResult.quality.estimatedPerplexity}`);
console.log(`Burstiness: ${premiumResult.quality.estimatedBurstiness}`);
```

## 📊 Prompt Engineering Strategies

### 1. Layered Prompt Architecture

Each prompt consists of multiple layers that work together:

```typescript
// System Layer - Establishes AI persona and expertise
"You are an expert American editor and creative writer, renowned for your ability to transform technical and robotic text into engaging, fluid, and natural-sounding prose."

// Context Layer - Defines the mission and objective  
"Your task is to rewrite the user-provided text that follows. The primary objective is to make the final output indistinguishable from content written by a human."

// Constraints Layer - Specific rules and requirements
"1. **Sentence Structure:** Include a dynamic mix of sentence structures..."
"2. **Vocabulary:** Replace generic and overused words..."
"3. **Idiomatic Language:** Incorporate common idiomatic expressions..."

// Reasoning Layer (Premium) - Chain-of-Thought analysis
"Let's think step by step. Before providing the final rewritten text, first analyze..."

// Critique Layer (Premium) - Self-review and refinement
"After generating the rewritten text, perform a final review..."
```

### 2. Content-Specific Templates

Different templates optimized for different content types:

| Content Type | Focus | Template Features |
|-------------|-------|------------------|
| **Academic** | Scholarly authority | Formulaic phrase replacement, citation integration |
| **Business** | Professional clarity | Corporate jargon elimination, human warmth |
| **Creative** | Narrative flow | Sensory details, emotional resonance, rhythm |
| **Technical** | Accuracy + readability | Precision maintenance, clarity enhancement |

### 3. Advanced Reasoning Patterns

#### Chain-of-Thought (CoT)
```typescript
const cotPrompt = AdvancedReasoningManager.applyChainOfThought(basePrompt, [
  'Analyze input text for AI characteristics',
  'Plan humanization strategy', 
  'Execute transformation with plan'
]);
```

#### Self-Consistency
```typescript
const scPrompt = AdvancedReasoningManager.applySelfConsistency(basePrompt, 3, [
  'Natural sentence flow and variety',
  'Vocabulary richness and appropriateness',
  'Overall human-likeness'
]);
```

#### Self-Critique
```typescript
const critiquePrompt = AdvancedReasoningManager.applySelfCritique(basePrompt, [
  'Does it sound natural and engaging?',
  'Is sentence structure sufficiently varied?',
  'Are there any remaining robotic patterns?'
]);
```

## 🎚️ User Experience Tiers

### Standard Users (Default Mode)
```
Input Text → Dynamic Prompt Selection → Recursive Character Prompt → 
LLM Processing → Quality Analysis → Humanized Output
```

- Fast processing (~800ms typical)
- Structural boundary respect
- Basic vocabulary enhancement
- 15% chunk overlap

### Premium Users (Personal Touch Mode)
```
Input Text → Content Analysis → Advanced Template Selection → 
Chain-of-Thought → LLM Processing → Self-Critique → 
Quality Validation → Humanized Output
```

- Enhanced processing (1-3s typical)
- Semantic boundary intelligence
- Advanced reasoning patterns
- Quality metrics and recommendations
- 20% chunk overlap
- Self-consistency validation

## 🔧 Configuration Options

### Humanization Levels

| Level | Description | Processing | Features |
|-------|-------------|------------|----------|
| **Light** | Subtle modifications | Fast | Vocabulary improvement, minor structure variation |
| **Moderate** | Balanced transformation | Medium | Noticeable improvements, maintained readability |
| **Aggressive** | Extensive rewriting | Slower | Maximum variation, extensive restructuring |

### Text Context Analysis

The system automatically analyzes:
- **Content Type**: Academic, business, creative, technical
- **Complexity**: Simple, moderate, complex (based on word/sentence length)
- **Length**: Short, medium, long (token count)
- **Domain**: Specific subject matter detection

### Quality Metrics

The system provides comprehensive quality assessment:

```typescript
interface QualityMetrics {
  sentenceVariety: number;      // 0-1 scale
  vocabularyRichness: number;   // 0-1 scale  
  naturalness: number;          // 0-1 scale
  estimatedPerplexity: number;  // AI unpredictability
  estimatedBurstiness: number;  // Sentence variation
  qualityScore: number;         // Overall score
}
```

## 🛠️ Implementation Details

### Key Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `TextHumanizer` | Main API facade | `humanize()` |
| `HumanizationService` | Core orchestrator | `processHumanizationRequest()` |
| `DynamicPromptGenerator` | Prompt selection | `generatePromptForChunk()` |
| `HumanizationPromptFactory` | Template creation | `createPremiumTemplate()` |
| `AdvancedReasoningManager` | Reasoning patterns | `applyChainOfThought()` |
| `MockLLMService` | Development LLM | `generateText()` |

### Prompt Template Structure

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'standard' | 'premium' | 'experimental';
  layers: PromptLayer[];
  metadata: {
    createdAt: Date;
    author: string;
    tags: string[];
    performanceScore?: number;
  };
}
```

### Dynamic Selection Logic

```typescript
// Template selection based on context
if (isPremium && mode === 'personal-touch') {
  if (humanizationLevel === 'aggressive' && enableAdvancedReasoning) {
    return SelfConsistencyTemplate;
  }
  
  switch (contentType) {
    case 'academic': return AcademicTemplate;
    case 'creative': return CreativeTemplate;
    case 'business': return BusinessTemplate;
    default: return PremiumTemplate;
  }
} else {
  return StandardTemplate;
}
```

## 📈 Performance Features

### Optimization Techniques

1. **Template Caching**: Pre-loaded templates for fast access
2. **Content Analysis**: Efficient text characteristic detection
3. **Quality Estimation**: Real-time humanization assessment
4. **Fallback Handling**: Graceful degradation on errors
5. **Token Management**: Efficient token counting and usage tracking

### Performance Metrics

```typescript
interface ProcessingMetrics {
  totalProcessingTime: number;    // Total request time
  promptGenerationTime: number;   // Template selection time
  llmProcessingTime: number;      // LLM API call time
  qualityAnalysisTime: number;    // Quality assessment time
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}
```

## 🧪 Testing

### Running Tests

```bash
# Install dependencies (if not already done)
npm install

# Run tests (when implemented)
npm test

# Run demo
npx ts-node demo.ts
```

### Demo Features

The demo script showcases:
- Default vs premium user comparison
- Content type adaptation
- Humanization level variations
- Advanced reasoning patterns
- Prompt template analysis

## 🔧 Advanced Usage

### Custom Template Creation

```typescript
import { PromptTemplateBuilder } from './src/core/prompt-template';

const customTemplate = new PromptTemplateBuilder(
  'Custom Academic Template',
  'Specialized for research papers'
)
  .setCategory('premium')
  .addSystemLayer('You are a distinguished academic researcher...')
  .addContextLayer('Transform this research text...')
  .addConstraintsLayer('Maintain scholarly rigor while...')
  .addReasoningLayer('Analyze the academic conventions...')
  .build();
```

### Direct Service Usage

```typescript
import { HumanizationService, HumanizationRequestBuilder } from './src/services/humanization-service';

const service = new HumanizationService('development');

const request = new HumanizationRequestBuilder('user123')
  .setChunks(textChunks)
  .setPromptConfiguration(config)
  .setPriority('high')
  .build();

const response = await service.processHumanizationRequest(request);
```

### Advanced Reasoning Combinations

```typescript
import { AdvancedReasoningManager } from './src/patterns/advanced-reasoning';

// Combine multiple reasoning patterns
const enhancedPrompt = AdvancedReasoningManager.applyCombinedReasoning(
  basePrompt,
  [
    {
      type: 'chain-of-thought',
      enabled: true,
      parameters: { steps: customSteps }
    },
    {
      type: 'self-critique', 
      enabled: true,
      parameters: { criteria: customCriteria }
    }
  ]
);
```

## 🔮 Production Considerations

### LLM Integration

Replace the mock service with actual LLM providers:

```typescript
// Example OpenAI integration
import { OpenAI } from 'openai';

class OpenAIService implements ILLMService {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async generateText(prompt: string, provider: LLMProvider) {
    const response = await this.openai.chat.completions.create({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: provider.temperature,
      max_tokens: provider.maxTokens
    });
    
    return {
      text: response.choices[0].message.content,
      metadata: {
        tokenUsage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0
        },
        finishReason: response.choices[0].finish_reason,
        processingTime: Date.now() - startTime
      }
    };
  }
}
```

### Scaling Considerations

- **Caching**: Redis for template and prompt caching
- **Queue Management**: Bull/Agenda for request queuing
- **Rate Limiting**: Provider-specific rate limit handling
- **Monitoring**: Prometheus metrics for performance tracking
- **Logging**: Structured logging for debugging and analytics

### Security

- **API Key Management**: Secure credential storage
- **Input Validation**: Sanitize user inputs
- **Rate Limiting**: Prevent abuse
- **Audit Logging**: Track usage patterns

## 📊 Analytics and Monitoring

### Key Metrics to Track

- Prompt selection distribution
- Processing times by template type
- Quality scores by user tier
- LLM API usage and costs
- Error rates and fallback frequency

### Quality Assessment

```typescript
// Built-in quality analysis
const analysis = await strategy.analyzeChunkQuality(chunks);
console.log(analysis.boundaryQuality); // 'excellent' | 'good' | 'fair' | 'poor'
```

## 🔄 Integration with Stage 1

This system seamlessly integrates with the Stage 1 chunking system:

```typescript
import { TextChunker } from '../stage1_preprocessing/src/index';
import { TextHumanizer } from './src/index';

// Stage 1: Semantic chunking
const chunker = new TextChunker();
const chunkResult = await chunker.chunk(originalText, {
  userId: 'user123',
  isPremium: true,
  mode: 'personal-touch'
});

// Stage 2: Dynamic prompt humanization
const humanizer = new TextHumanizer();
const humanizedResult = await humanizer.humanize(chunkResult.chunks, {
  userId: 'user123',
  isPremium: true,
  mode: 'personal-touch',
  textType: 'academic',
  humanizationLevel: 'aggressive'
});
```

## 🔧 Extension Points

The system is designed for extensibility:

- **Custom Templates**: Add domain-specific prompt templates
- **New Reasoning Patterns**: Implement additional advanced techniques
- **LLM Providers**: Integrate with different AI services
- **Quality Metrics**: Add custom quality assessment algorithms
- **Content Analysis**: Enhance text classification capabilities

## 📝 License

This prompt engineering system is part of the AI Humanizer application and follows the project's licensing terms.

---

**Note**: This implementation provides a production-ready foundation for sophisticated prompt engineering with clear separation between free and premium features, advanced reasoning capabilities, and comprehensive quality assessment.
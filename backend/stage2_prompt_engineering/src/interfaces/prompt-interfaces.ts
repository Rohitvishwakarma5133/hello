/**
 * Core interfaces for the Dynamic and Layered Prompt Engineering System
 * Stage 2.1 - AI Humanizer Backend
 */

export interface TextChunk {
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

export interface UserContext {
  userId: string;
  isPremium: boolean;
  selectedMode: 'default' | 'personal-touch';
  preferences?: {
    writingStyle?: 'academic' | 'casual' | 'professional' | 'creative';
    complexity?: 'simple' | 'moderate' | 'complex';
    formality?: 'informal' | 'neutral' | 'formal';
  };
}

/**
 * Represents a single layer in the layered prompt architecture
 */
export interface PromptLayer {
  id: string;
  name: string;
  type: 'system' | 'context' | 'constraints' | 'reasoning' | 'critique';
  content: string;
  variables?: Record<string, any>;
  order: number;
  isActive: boolean;
}

/**
 * Complete prompt template with multiple layers
 */
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'standard' | 'premium' | 'experimental';
  layers: PromptLayer[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    tags: string[];
    performanceScore?: number;
    usageCount?: number;
  };
}

/**
 * Configuration for dynamic prompt generation
 */
export interface PromptConfiguration {
  templateId?: string;
  userContext: UserContext;
  textContext: {
    type: 'academic' | 'technical' | 'creative' | 'business' | 'general';
    length: 'short' | 'medium' | 'long';
    complexity: 'simple' | 'moderate' | 'complex';
    domain?: string;
  };
  humanizationLevel: 'light' | 'moderate' | 'aggressive';
  enableAdvancedReasoning: boolean;
  enableSelfCritique: boolean;
  customInstructions?: string[];
}

/**
 * Result of prompt generation
 */
export interface GeneratedPrompt {
  id: string;
  templateId: string;
  fullPrompt: string;
  layers: {
    system: string;
    context: string;
    constraints: string;
    reasoning?: string;
    critique?: string;
  };
  variables: Record<string, any>;
  metadata: {
    generatedAt: Date;
    configuration: PromptConfiguration;
    estimatedTokens: number;
  };
}

/**
 * LLM provider configuration
 */
export interface LLMProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  apiKey: string;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * Request to LLM for text humanization
 */
export interface HumanizationRequest {
  id: string;
  userId: string;
  chunks: TextChunk[];
  promptConfiguration: PromptConfiguration;
  llmProvider: LLMProvider;
  priority: 'low' | 'normal' | 'high';
  metadata: {
    originalTextHash: string;
    requestedAt: Date;
    clientInfo?: Record<string, any>;
  };
}

/**
 * Response from LLM humanization
 */
export interface HumanizationResponse {
  id: string;
  requestId: string;
  processedChunks: ProcessedChunk[];
  metadata: {
    processedAt: Date;
    totalProcessingTime: number;
    llmProvider: string;
    promptTemplate: string;
    tokenUsage: {
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    };
  };
  quality: {
    estimatedPerplexity?: number;
    estimatedBurstiness?: number;
    qualityScore?: number;
  };
}

/**
 * Individual processed text chunk
 */
export interface ProcessedChunk {
  originalChunk: TextChunk;
  humanizedContent: string;
  processingMetadata: {
    promptUsed: string;
    processingTime: number;
    llmResponse: {
      finishReason: string;
      logprobs?: any;
    };
    qualityIndicators: {
      sentenceVariety: number;
      vocabularyRichness: number;
      naturalness: number;
    };
  };
}

/**
 * Advanced reasoning pattern configuration
 */
export interface ReasoningPattern {
  type: 'chain-of-thought' | 'self-consistency' | 'self-critique' | 'step-back';
  enabled: boolean;
  parameters: {
    steps?: string[];
    iterations?: number;
    criteriа?: string[];
    temperature?: number;
  };
}

/**
 * Prompt optimization and A/B testing
 */
export interface PromptExperiment {
  id: string;
  name: string;
  description: string;
  variants: {
    id: string;
    name: string;
    templateId: string;
    traffic: number; // percentage 0-100
  }[];
  metrics: {
    detectionEvasionRate: number;
    qualityScore: number;
    processingTime: number;
    userSatisfaction: number;
  };
  status: 'draft' | 'running' | 'completed' | 'paused';
  duration: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Feedback for prompt performance
 */
export interface PromptFeedback {
  promptTemplateId: string;
  requestId: string;
  detectionResults: {
    detector: string;
    score: number;
    passed: boolean;
  }[];
  qualityMetrics: {
    humanLikeness: number;
    coherence: number;
    readability: number;
  };
  userFeedback?: {
    rating: number;
    comments: string;
  };
  timestamp: Date;
}

/**
 * Interface for prompt template repository
 */
export interface IPromptTemplateRepository {
  getTemplate(id: string): Promise<PromptTemplate | null>;
  getTemplatesByCategory(category: string): Promise<PromptTemplate[]>;
  saveTemplate(template: PromptTemplate): Promise<void>;
  updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  searchTemplates(query: string): Promise<PromptTemplate[]>;
}

/**
 * Interface for LLM service
 */
export interface ILLMService {
  generateText(prompt: string, provider: LLMProvider): Promise<{
    text: string;
    metadata: {
      tokenUsage: {
        inputTokens: number;
        outputTokens: number;
      };
      finishReason: string;
      processingTime: number;
    };
  }>;
  
  validateProvider(provider: LLMProvider): Promise<boolean>;
  estimateTokens(text: string): number;
}

/**
 * Interface for prompt generation service
 */
export interface IPromptGenerator {
  generatePrompt(configuration: PromptConfiguration): Promise<GeneratedPrompt>;
  generatePromptForChunk(chunk: TextChunk, configuration: PromptConfiguration): Promise<GeneratedPrompt>;
  validatePrompt(prompt: GeneratedPrompt): boolean;
}

/**
 * Text analysis metrics for humanization assessment
 */
export interface TextMetrics {
  perplexity: number;
  burstiness: number;
  sentenceVariety: number;
  vocabularyRichness: number;
  averageSentenceLength: number;
  lexicalDiversity: number;
  readabilityScore: number;
  coherenceScore: number;
}
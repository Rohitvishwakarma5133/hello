import {
  HumanizationRequest,
  HumanizationResponse,
  ProcessedChunk,
  TextChunk,
  UserContext,
  PromptConfiguration,
  LLMProvider,
  GeneratedPrompt,
  ILLMService,
  IPromptGenerator
} from '../interfaces/prompt-interfaces';
import { DynamicPromptGenerator } from './prompt-generator';
import { LLMServiceFactory } from './llm-service';
import { AdvancedReasoningManager } from '../patterns/advanced-reasoning';
import { DEFAULT_PROVIDERS } from './llm-service';

/**
 * Main Humanization Service
 * Orchestrates the complete text humanization process using dynamic prompts and LLM integration
 * This is the core service that implements Stage 2.1 requirements
 */
export class HumanizationService {
  private promptGenerator: IPromptGenerator;
  private llmService: ILLMService;
  private defaultProvider: LLMProvider;

  constructor(
    environment: 'development' | 'production' = 'development',
    customProvider?: LLMProvider
  ) {
    this.promptGenerator = new DynamicPromptGenerator();
    this.llmService = LLMServiceFactory.create(environment);
    
    // Set up default provider with dummy API key for development
    this.defaultProvider = customProvider || {
      ...DEFAULT_PROVIDERS['openai-gpt4'],
      apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-development'
    } as LLMProvider;
  }

  /**
   * Process a complete humanization request
   */
  async processHumanizationRequest(request: HumanizationRequest): Promise<HumanizationResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`[HumanizationService] Processing request ${request.id} for user ${request.userId}`);
      
      // Process each chunk
      const processedChunks: ProcessedChunk[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (const chunk of request.chunks) {
        console.log(`[HumanizationService] Processing chunk ${chunk.id}`);
        
        const processedChunk = await this.processChunk(
          chunk,
          request.promptConfiguration,
          request.llmProvider || this.defaultProvider
        );
        
        processedChunks.push(processedChunk);
        totalInputTokens += processedChunk.processingMetadata.llmResponse.finishReason === 'stop' ? 
          this.estimateTokens(chunk.content) : 0;
        totalOutputTokens += this.estimateTokens(processedChunk.humanizedContent);
      }

      const processingTime = Date.now() - startTime;
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(processedChunks);

      const response: HumanizationResponse = {
        id: this.generateResponseId(),
        requestId: request.id,
        processedChunks,
        metadata: {
          processedAt: new Date(),
          totalProcessingTime: processingTime,
          llmProvider: (request.llmProvider || this.defaultProvider).name,
          promptTemplate: request.promptConfiguration.templateId || 'dynamic',
          tokenUsage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens
          }
        },
        quality: qualityMetrics
      };

      console.log(`[HumanizationService] Completed request ${request.id} in ${processingTime}ms`);
      return response;

    } catch (error) {
      console.error(`[HumanizationService] Failed to process request ${request.id}:`, error);
      throw new Error(`Humanization processing failed: ${error}`);
    }
  }

  /**
   * Process a single text chunk
   */
  async processChunk(
    chunk: TextChunk,
    configuration: PromptConfiguration,
    provider: LLMProvider
  ): Promise<ProcessedChunk> {
    const chunkStartTime = Date.now();

    try {
      // Generate dynamic prompt for this chunk
      const prompt = await this.promptGenerator.generatePromptForChunk(chunk, configuration);
      
      // Apply advanced reasoning patterns if enabled
      const enhancedPrompt = this.applyAdvancedReasoning(prompt, configuration, chunk);
      
      // Call LLM to humanize the text
      const llmResponse = await this.llmService.generateText(enhancedPrompt.fullPrompt, provider);
      
      // Calculate quality indicators
      const qualityIndicators = this.calculateChunkQuality(chunk.content, llmResponse.text);
      
      const processingTime = Date.now() - chunkStartTime;

      return {
        originalChunk: chunk,
        humanizedContent: llmResponse.text,
        processingMetadata: {
          promptUsed: enhancedPrompt.id,
          processingTime,
          llmResponse: {
            finishReason: llmResponse.metadata.finishReason,
            logprobs: null // Not available in mock implementation
          },
          qualityIndicators
        }
      };

    } catch (error) {
      console.error(`[HumanizationService] Failed to process chunk ${chunk.id}:`, error);
      throw new Error(`Chunk processing failed: ${error}`);
    }
  }

  /**
   * Apply advanced reasoning patterns to prompts
   */
  private applyAdvancedReasoning(
    basePrompt: GeneratedPrompt,
    configuration: PromptConfiguration,
    chunk: TextChunk
  ): GeneratedPrompt {
    // Skip advanced reasoning for non-premium users
    if (!configuration.userContext.isPremium) {
      return basePrompt;
    }

    let enhancedPrompt = basePrompt;

    // Apply Chain-of-Thought for premium users
    if (configuration.enableAdvancedReasoning) {
      enhancedPrompt = AdvancedReasoningManager.applyChainOfThought(enhancedPrompt);
    }

    // Apply Self-Critique for personal-touch mode
    if (configuration.enableSelfCritique) {
      enhancedPrompt = AdvancedReasoningManager.applySelfCritique(enhancedPrompt);
    }

    // Apply Self-Consistency for aggressive humanization
    if (configuration.humanizationLevel === 'aggressive' && 
        configuration.userContext.selectedMode === 'personal-touch') {
      enhancedPrompt = AdvancedReasoningManager.applySelfConsistency(enhancedPrompt, 3);
    }

    return enhancedPrompt;
  }

  /**
   * Calculate quality metrics for processed chunks
   */
  private calculateQualityMetrics(processedChunks: ProcessedChunk[]): HumanizationResponse['quality'] {
    const qualityScores = processedChunks.map(chunk => chunk.processingMetadata.qualityIndicators);
    
    const avgSentenceVariety = qualityScores.reduce((sum, q) => sum + q.sentenceVariety, 0) / qualityScores.length;
    const avgVocabularyRichness = qualityScores.reduce((sum, q) => sum + q.vocabularyRichness, 0) / qualityScores.length;
    const avgNaturalness = qualityScores.reduce((sum, q) => sum + q.naturalness, 0) / qualityScores.length;

    // Estimate perplexity and burstiness improvements
    const estimatedPerplexity = this.estimatePerplexityImprovement(avgVocabularyRichness);
    const estimatedBurstiness = this.estimateBurstinessImprovement(avgSentenceVariety);
    
    // Calculate overall quality score
    const qualityScore = (avgSentenceVariety + avgVocabularyRichness + avgNaturalness) / 3;

    return {
      estimatedPerplexity,
      estimatedBurstiness,
      qualityScore
    };
  }

  /**
   * Calculate quality indicators for a single chunk
   */
  private calculateChunkQuality(originalText: string, humanizedText: string): ProcessedChunk['processingMetadata']['qualityIndicators'] {
    // Sentence variety analysis
    const originalSentences = this.extractSentences(originalText);
    const humanizedSentences = this.extractSentences(humanizedText);
    
    const sentenceVariety = this.calculateSentenceVariety(humanizedSentences);
    
    // Vocabulary richness analysis
    const vocabularyRichness = this.calculateVocabularyRichness(originalText, humanizedText);
    
    // Naturalness assessment
    const naturalness = this.assessNaturalness(humanizedText);

    return {
      sentenceVariety: Math.min(1.0, Math.max(0.0, sentenceVariety)),
      vocabularyRichness: Math.min(1.0, Math.max(0.0, vocabularyRichness)),
      naturalness: Math.min(1.0, Math.max(0.0, naturalness))
    };
  }

  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  private calculateSentenceVariety(sentences: string[]): number {
    if (sentences.length <= 1) return 0.5;

    const lengths = sentences.map(s => s.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Normalize variance to 0-1 scale
    const coefficientOfVariation = Math.sqrt(variance) / avgLength;
    return Math.min(1.0, coefficientOfVariation * 2); // Scale factor for reasonable range
  }

  private calculateVocabularyRichness(originalText: string, humanizedText: string): number {
    const originalWords = this.extractWords(originalText);
    const humanizedWords = this.extractWords(humanizedText);
    
    const originalUniqueWords = new Set(originalWords.map(w => w.toLowerCase()));
    const humanizedUniqueWords = new Set(humanizedWords.map(w => w.toLowerCase()));
    
    // Calculate lexical diversity improvement
    const originalDiversity = originalUniqueWords.size / originalWords.length;
    const humanizedDiversity = humanizedUniqueWords.size / humanizedWords.length;
    
    // Bonus for introducing new vocabulary
    const newWordsIntroduced = Array.from(humanizedUniqueWords).filter(
      word => !originalUniqueWords.has(word)
    ).length;
    
    const diversityImprovement = (humanizedDiversity - originalDiversity) + (newWordsIntroduced / humanizedWords.length);
    
    return Math.max(0.3, 0.5 + diversityImprovement * 2); // Base score + improvement
  }

  private assessNaturalness(text: string): number {
    let naturalness = 0.5; // Base score
    
    // Check for AI detection patterns (negative indicators)
    const aiPatterns = [
      /it is important to note/gi,
      /furthermore,/gi,
      /in conclusion,/gi,
      /additionally,/gi,
      /moreover,/gi
    ];
    
    const aiPatternCount = aiPatterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    // Penalize AI patterns
    naturalness -= aiPatternCount * 0.1;
    
    // Check for natural indicators (positive signs)
    const naturalIndicators = [
      /\b(actually|really|quite|pretty much|sort of|kind of)\b/gi, // Hedging words
      /\b(obviously|clearly|frankly|honestly)\b/gi, // Stance markers
      /\b(however|nevertheless|on the other hand)\b/gi, // Natural transitions
    ];
    
    const naturalCount = naturalIndicators.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    // Reward natural indicators
    naturalness += naturalCount * 0.05;
    
    return Math.min(1.0, Math.max(0.0, naturalness));
  }

  private extractWords(text: string): string[] {
    return text.toLowerCase().split(/\W+/).filter(word => word.length > 0);
  }

  private estimatePerplexityImprovement(vocabularyRichness: number): number {
    // Higher vocabulary richness suggests higher perplexity (less predictable)
    return Math.min(0.9, 0.3 + vocabularyRichness * 0.6);
  }

  private estimateBurstinessImprovement(sentenceVariety: number): number {
    // Higher sentence variety suggests higher burstiness
    return Math.min(0.9, 0.2 + sentenceVariety * 0.7);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate provider configuration
   */
  async validateProvider(provider: LLMProvider): Promise<boolean> {
    return this.llmService.validateProvider(provider);
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      promptGenerator: boolean;
      llmService: boolean;
      defaultProvider: boolean;
    };
    timestamp: Date;
  }> {
    const services = {
      promptGenerator: true, // Always available
      llmService: true, // Mock service is always available
      defaultProvider: await this.validateProvider(this.defaultProvider)
    };

    const allHealthy = Object.values(services).every(status => status === true);
    const status = allHealthy ? 'healthy' : 'degraded';

    return {
      status,
      services,
      timestamp: new Date()
    };
  }
}

/**
 * Humanization request builder for easy request construction
 */
export class HumanizationRequestBuilder {
  private request: Partial<HumanizationRequest> = {};

  constructor(userId: string) {
    this.request = {
      id: this.generateRequestId(),
      userId,
      chunks: [],
      priority: 'normal',
      metadata: {
        originalTextHash: '',
        requestedAt: new Date()
      }
    };
  }

  setChunks(chunks: TextChunk[]): HumanizationRequestBuilder {
    this.request.chunks = chunks;
    
    // Generate hash of original text
    const originalText = chunks.map(c => c.content).join('');
    this.request.metadata!.originalTextHash = this.generateTextHash(originalText);
    
    return this;
  }

  setPromptConfiguration(config: PromptConfiguration): HumanizationRequestBuilder {
    this.request.promptConfiguration = config;
    return this;
  }

  setProvider(provider: LLMProvider): HumanizationRequestBuilder {
    this.request.llmProvider = provider;
    return this;
  }

  setPriority(priority: 'low' | 'normal' | 'high'): HumanizationRequestBuilder {
    this.request.priority = priority;
    return this;
  }

  setClientInfo(clientInfo: Record<string, any>): HumanizationRequestBuilder {
    if (!this.request.metadata) {
      this.request.metadata = {
        originalTextHash: '',
        requestedAt: new Date()
      };
    }
    this.request.metadata.clientInfo = clientInfo;
    return this;
  }

  build(): HumanizationRequest {
    // Validate required fields
    if (!this.request.chunks || this.request.chunks.length === 0) {
      throw new Error('Chunks are required for humanization request');
    }

    if (!this.request.promptConfiguration) {
      throw new Error('Prompt configuration is required for humanization request');
    }

    return this.request as HumanizationRequest;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTextHash(text: string): string {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
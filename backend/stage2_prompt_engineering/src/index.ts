// Core interfaces and types
export * from './interfaces/prompt-interfaces';

// Core prompt system
export { 
  PromptLayerBuilder, 
  PromptTemplateBuilder,
  VariableInterpolator,
  PromptComposer
} from './core/prompt-template';

// Template factories and predefined prompts
export { 
  HumanizationPromptFactory,
  HUMANIZATION_CONSTANTS
} from './templates/humanization-templates';

// Services
export { DynamicPromptGenerator, PromptAdaptationService } from './services/prompt-generator';
export { HumanizationService, HumanizationRequestBuilder } from './services/humanization-service';
export { 
  MockLLMService, 
  ProductionLLMService, 
  LLMServiceFactory, 
  DEFAULT_PROVIDERS 
} from './services/llm-service';

// Advanced reasoning patterns
export { 
  AdvancedReasoningManager, 
  ReasoningPatternFactory 
} from './patterns/advanced-reasoning';

// Main facade for easy usage
import { HumanizationService, HumanizationRequestBuilder } from './services/humanization-service';
import { 
  TextChunk, 
  UserContext, 
  PromptConfiguration, 
  LLMProvider 
} from './interfaces/prompt-interfaces';

/**
 * Simple facade for text humanization using dynamic prompts
 * This is the main entry point for Stage 2.1 - Dynamic and Layered Prompt Engineering
 */
export class TextHumanizer {
  private service: HumanizationService;

  constructor(environment: 'development' | 'production' = 'development') {
    this.service = new HumanizationService(environment);
  }

  /**
   * Humanize text chunks with automatic prompt selection
   */
  async humanize(
    chunks: TextChunk[],
    options: {
      userId: string;
      isPremium?: boolean;
      mode?: 'default' | 'personal-touch';
      textType?: 'general' | 'academic' | 'creative' | 'business' | 'technical';
      humanizationLevel?: 'light' | 'moderate' | 'aggressive';
      enableAdvancedReasoning?: boolean;
      enableSelfCritique?: boolean;
      customInstructions?: string[];
      provider?: LLMProvider;
    }
  ) {
    const userContext: UserContext = {
      userId: options.userId,
      isPremium: options.isPremium || false,
      selectedMode: options.mode || 'default'
    };

    const promptConfiguration: PromptConfiguration = {
      userContext,
      textContext: {
        type: options.textType || 'general',
        length: 'medium', // Will be analyzed per chunk
        complexity: 'moderate' // Will be analyzed per chunk
      },
      humanizationLevel: options.humanizationLevel || 'moderate',
      enableAdvancedReasoning: options.enableAdvancedReasoning || (options.isPremium && options.mode === 'personal-touch'),
      enableSelfCritique: options.enableSelfCritique || (options.isPremium && options.mode === 'personal-touch'),
      customInstructions: options.customInstructions
    };

    const request = new HumanizationRequestBuilder(options.userId)
      .setChunks(chunks)
      .setPromptConfiguration(promptConfiguration)
      .setPriority('normal');

    if (options.provider) {
      request.setProvider(options.provider);
    }

    return this.service.processHumanizationRequest(request.build());
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    return this.service.getHealthStatus();
  }

  /**
   * Validate LLM provider configuration
   */
  async validateProvider(provider: LLMProvider) {
    return this.service.validateProvider(provider);
  }
}

// Default export
export default TextHumanizer;
import {
  PromptConfiguration,
  GeneratedPrompt,
  TextChunk,
  UserContext,
  IPromptGenerator,
  PromptTemplate
} from '../interfaces/prompt-interfaces';
import { HumanizationPromptFactory } from '../templates/humanization-templates';
import { PromptComposer, VariableInterpolator } from '../core/prompt-template';

/**
 * Dynamic Prompt Generator
 * Intelligently selects and customizes prompts based on user context and text characteristics
 */
export class DynamicPromptGenerator implements IPromptGenerator {
  private templateCache = new Map<string, PromptTemplate>();

  constructor() {
    this.initializeTemplateCache();
  }

  /**
   * Generate a prompt based on configuration
   */
  async generatePrompt(configuration: PromptConfiguration): Promise<GeneratedPrompt> {
    const template = await this.selectOptimalTemplate(configuration);
    const variables = this.extractVariables(configuration);
    
    return this.composePrompt(template, variables, configuration);
  }

  /**
   * Generate a prompt for a specific text chunk
   */
  async generatePromptForChunk(
    chunk: TextChunk, 
    configuration: PromptConfiguration
  ): Promise<GeneratedPrompt> {
    // Enhance configuration with chunk-specific context
    const enhancedConfig = this.enhanceConfigurationWithChunk(configuration, chunk);
    
    const template = await this.selectOptimalTemplate(enhancedConfig);
    const variables = this.extractVariablesFromChunk(chunk, enhancedConfig);
    
    return this.composePrompt(template, variables, enhancedConfig);
  }

  /**
   * Validate a generated prompt
   */
  validatePrompt(prompt: GeneratedPrompt): boolean {
    // Check required layers
    if (!prompt.layers.system || !prompt.layers.context || !prompt.layers.constraints) {
      return false;
    }

    // Validate variable interpolation
    const fullPrompt = prompt.fullPrompt;
    const remainingVariables = VariableInterpolator.extractVariables(fullPrompt);
    
    // Should have no unresolved variables
    return remainingVariables.length === 0;
  }

  /**
   * Select the optimal template based on configuration
   */
  private async selectOptimalTemplate(configuration: PromptConfiguration): Promise<PromptTemplate> {
    // If specific template is requested
    if (configuration.templateId && this.templateCache.has(configuration.templateId)) {
      return this.templateCache.get(configuration.templateId)!;
    }

    // Dynamic template selection based on context
    return this.selectTemplateByContext(configuration);
  }

  /**
   * Select template based on user and text context
   */
  private selectTemplateByContext(configuration: PromptConfiguration): PromptTemplate {
    const { userContext, textContext, humanizationLevel, enableAdvancedReasoning } = configuration;

    // Premium users get advanced features
    if (userContext.isPremium && userContext.selectedMode === 'personal-touch') {
      // Self-consistency for highest quality requests
      if (humanizationLevel === 'aggressive' && enableAdvancedReasoning) {
        return HumanizationPromptFactory.createSelfConsistencyTemplate();
      }
      
      // Content-specific premium templates
      switch (textContext.type) {
        case 'academic':
        case 'technical':
          return HumanizationPromptFactory.createAcademicTemplate();
        case 'creative':
          return HumanizationPromptFactory.createCreativeTemplate();
        case 'business':
          return HumanizationPromptFactory.createBusinessTemplate();
        default:
          return HumanizationPromptFactory.createPremiumTemplate();
      }
    }

    // Standard users get basic templates
    switch (textContext.type) {
      case 'business':
        return HumanizationPromptFactory.createBusinessTemplate();
      default:
        return HumanizationPromptFactory.createStandardTemplate();
    }
  }

  /**
   * Extract variables from configuration
   */
  private extractVariables(configuration: PromptConfiguration): Record<string, any> {
    const { userContext, textContext, humanizationLevel } = configuration;

    const variables: Record<string, any> = {
      // User context variables
      writingStyle: userContext.preferences?.writingStyle || 'professional',
      complexity: userContext.preferences?.complexity || 'moderate',
      formality: userContext.preferences?.formality || 'neutral',
      
      // Text context variables
      textType: textContext.type,
      textLength: textContext.length,
      textComplexity: textContext.complexity,
      textDomain: textContext.domain || 'general',
      
      // Humanization variables
      humanizationLevel,
      intensityLevel: this.getIntensityLevel(humanizationLevel),
      
      // Dynamic instructions
      customInstructions: configuration.customInstructions?.join('\n') || ''
    };

    return variables;
  }

  /**
   * Extract variables specifically from a text chunk
   */
  private extractVariablesFromChunk(
    chunk: TextChunk, 
    configuration: PromptConfiguration
  ): Record<string, any> {
    const baseVariables = this.extractVariables(configuration);
    
    return {
      ...baseVariables,
      textContent: chunk.content,
      chunkId: chunk.id,
      tokenCount: chunk.tokenCount,
      semanticScore: chunk.metadata?.semanticScore || 0.5,
      boundaryType: chunk.metadata?.boundaryType || 'paragraph'
    };
  }

  /**
   * Compose the final prompt from template and variables
   */
  private composePrompt(
    template: PromptTemplate,
    variables: Record<string, any>,
    configuration: PromptConfiguration
  ): GeneratedPrompt {
    const fullPrompt = PromptComposer.compose(template, variables);
    const structuredLayers = PromptComposer.composeStructured(template, variables);
    const estimatedTokens = PromptComposer.estimateTokens(fullPrompt);

    return {
      id: this.generatePromptId(),
      templateId: template.id,
      fullPrompt,
      layers: structuredLayers,
      variables,
      metadata: {
        generatedAt: new Date(),
        configuration,
        estimatedTokens
      }
    };
  }

  /**
   * Enhance configuration with chunk-specific analysis
   */
  private enhanceConfigurationWithChunk(
    configuration: PromptConfiguration,
    chunk: TextChunk
  ): PromptConfiguration {
    const enhancedTextContext = {
      ...configuration.textContext,
      length: this.analyzeChunkLength(chunk),
      complexity: this.analyzeChunkComplexity(chunk),
      type: this.analyzeContentType(chunk.content) || configuration.textContext.type
    };

    return {
      ...configuration,
      textContext: enhancedTextContext
    };
  }

  /**
   * Analyze chunk length category
   */
  private analyzeChunkLength(chunk: TextChunk): 'short' | 'medium' | 'long' {
    if (chunk.tokenCount < 100) return 'short';
    if (chunk.tokenCount < 400) return 'medium';
    return 'long';
  }

  /**
   * Analyze chunk complexity
   */
  private analyzeChunkComplexity(chunk: TextChunk): 'simple' | 'moderate' | 'complex' {
    const content = chunk.content;
    
    // Simple heuristics for complexity analysis
    const avgWordLength = content.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgSentenceLength = content.length / sentenceCount;
    
    // Calculate complexity score
    const complexityScore = (avgWordLength / 6) + (avgSentenceLength / 80);
    
    if (complexityScore < 0.6) return 'simple';
    if (complexityScore < 1.2) return 'moderate';
    return 'complex';
  }

  /**
   * Analyze content type from text
   */
  private analyzeContentType(text: string): 'academic' | 'technical' | 'creative' | 'business' | 'general' | null {
    const lowerText = text.toLowerCase();
    
    // Academic indicators
    const academicKeywords = ['research', 'study', 'analysis', 'hypothesis', 'methodology', 'conclusion', 'findings'];
    const academicCount = academicKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Technical indicators
    const technicalKeywords = ['system', 'algorithm', 'implementation', 'framework', 'architecture', 'protocol'];
    const technicalCount = technicalKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Business indicators
    const businessKeywords = ['strategy', 'market', 'customer', 'revenue', 'growth', 'profit', 'business'];
    const businessCount = businessKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Creative indicators
    const creativeKeywords = ['story', 'character', 'narrative', 'emotion', 'imagery', 'metaphor'];
    const creativeCount = creativeKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Determine dominant type
    const maxCount = Math.max(academicCount, technicalCount, businessCount, creativeCount);
    
    if (maxCount >= 2) {
      if (academicCount === maxCount) return 'academic';
      if (technicalCount === maxCount) return 'technical';
      if (businessCount === maxCount) return 'business';
      if (creativeCount === maxCount) return 'creative';
    }
    
    return null; // General/indeterminate
  }

  /**
   * Get intensity level description
   */
  private getIntensityLevel(humanizationLevel: 'light' | 'moderate' | 'aggressive'): string {
    switch (humanizationLevel) {
      case 'light':
        return 'subtle modifications while maintaining original structure';
      case 'moderate':
        return 'balanced transformation with noticeable improvements';
      case 'aggressive':
        return 'extensive rewriting with maximum humanization';
      default:
        return 'moderate humanization approach';
    }
  }

  /**
   * Initialize template cache
   */
  private initializeTemplateCache(): void {
    const templates = HumanizationPromptFactory.getAllTemplates();
    templates.forEach(template => {
      this.templateCache.set(template.id, template);
    });
  }

  /**
   * Generate unique prompt ID
   */
  private generatePromptId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available templates by category
   */
  getTemplatesByCategory(category: 'standard' | 'premium' | 'experimental'): PromptTemplate[] {
    return Array.from(this.templateCache.values())
      .filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): PromptTemplate | null {
    return this.templateCache.get(templateId) || null;
  }

  /**
   * Update template cache
   */
  updateTemplateCache(template: PromptTemplate): void {
    this.templateCache.set(template.id, template);
  }

  /**
   * Clear template cache (useful for testing)
   */
  clearTemplateCache(): void {
    this.templateCache.clear();
  }
}

/**
 * Prompt adaptation service for different scenarios
 */
export class PromptAdaptationService {
  /**
   * Adapt prompt for different humanization levels
   */
  static adaptForHumanizationLevel(
    basePrompt: GeneratedPrompt,
    level: 'light' | 'moderate' | 'aggressive'
  ): GeneratedPrompt {
    const adaptedVariables = {
      ...basePrompt.variables,
      humanizationLevel: level,
      intensityLevel: this.getIntensityDescription(level)
    };

    // Modify constraints based on intensity
    let adaptedConstraints = basePrompt.layers.constraints;
    
    switch (level) {
      case 'light':
        adaptedConstraints += '\n\nAPPROACH: Apply gentle modifications while preserving the original structure and style. Focus on subtle vocabulary improvements and minor sentence variation.';
        break;
      case 'aggressive':
        adaptedConstraints += '\n\nAPPROACH: Apply extensive transformation. Completely restructure sentences, dramatically vary vocabulary, and maximize linguistic unpredictability while maintaining meaning.';
        break;
      case 'moderate':
      default:
        adaptedConstraints += '\n\nAPPROACH: Balance structural changes with vocabulary enhancement. Provide noticeable improvements while maintaining readability and coherence.';
        break;
    }

    return {
      ...basePrompt,
      id: `${basePrompt.id}_adapted_${level}`,
      variables: adaptedVariables,
      layers: {
        ...basePrompt.layers,
        constraints: adaptedConstraints
      },
      fullPrompt: PromptComposer.compose({
        id: basePrompt.templateId,
        name: 'Adapted Template',
        description: 'Adapted template',
        version: '1.0.0',
        category: 'standard',
        layers: [
          { id: '1', name: 'system', type: 'system', content: basePrompt.layers.system, order: 1, isActive: true },
          { id: '2', name: 'context', type: 'context', content: basePrompt.layers.context, order: 2, isActive: true },
          { id: '3', name: 'constraints', type: 'constraints', content: adaptedConstraints, order: 3, isActive: true }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          author: 'system',
          tags: []
        }
      }, adaptedVariables)
    };
  }

  /**
   * Adapt prompt for specific content types
   */
  static adaptForContentType(
    basePrompt: GeneratedPrompt,
    contentType: 'academic' | 'creative' | 'business' | 'technical'
  ): GeneratedPrompt {
    const typeSpecificInstructions = this.getContentTypeInstructions(contentType);
    
    const adaptedConstraints = `${basePrompt.layers.constraints}\n\n${typeSpecificInstructions}`;

    return {
      ...basePrompt,
      id: `${basePrompt.id}_${contentType}`,
      layers: {
        ...basePrompt.layers,
        constraints: adaptedConstraints
      }
    };
  }

  private static getIntensityDescription(level: 'light' | 'moderate' | 'aggressive'): string {
    switch (level) {
      case 'light': return 'Subtle, structure-preserving modifications';
      case 'moderate': return 'Balanced transformation with clear improvements';
      case 'aggressive': return 'Extensive rewriting with maximum variation';
    }
  }

  private static getContentTypeInstructions(contentType: string): string {
    switch (contentType) {
      case 'academic':
        return 'ACADEMIC FOCUS: Maintain scholarly rigor while varying academic language patterns. Replace formulaic academic phrases with more sophisticated alternatives.';
      case 'creative':
        return 'CREATIVE FOCUS: Emphasize narrative flow, sensory details, and emotional resonance. Vary sentence rhythm to create engaging, story-like quality.';
      case 'business':
        return 'BUSINESS FOCUS: Transform corporate jargon into clear, professional communication. Maintain authority while adding human warmth and authenticity.';
      case 'technical':
        return 'TECHNICAL FOCUS: Preserve technical accuracy while improving readability. Vary explanatory structures and enhance clarity without losing precision.';
      default:
        return '';
    }
  }
}
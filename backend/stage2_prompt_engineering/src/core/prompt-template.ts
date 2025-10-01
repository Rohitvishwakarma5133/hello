import { 
  PromptTemplate, 
  PromptLayer, 
  UserContext, 
  PromptConfiguration,
  GeneratedPrompt 
} from '../interfaces/prompt-interfaces';

/**
 * Base class for managing individual prompt layers
 */
export class PromptLayerBuilder {
  private layer: PromptLayer;

  constructor(type: PromptLayer['type'], name: string, order: number) {
    this.layer = {
      id: this.generateId(),
      name,
      type,
      content: '',
      variables: {},
      order,
      isActive: true
    };
  }

  setContent(content: string): PromptLayerBuilder {
    this.layer.content = content;
    return this;
  }

  addVariable(key: string, value: any): PromptLayerBuilder {
    if (!this.layer.variables) {
      this.layer.variables = {};
    }
    this.layer.variables[key] = value;
    return this;
  }

  addVariables(variables: Record<string, any>): PromptLayerBuilder {
    if (!this.layer.variables) {
      this.layer.variables = {};
    }
    this.layer.variables = { ...this.layer.variables, ...variables };
    return this;
  }

  setActive(isActive: boolean): PromptLayerBuilder {
    this.layer.isActive = isActive;
    return this;
  }

  build(): PromptLayer {
    return { ...this.layer };
  }

  private generateId(): string {
    return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Builder class for constructing prompt templates with multiple layers
 */
export class PromptTemplateBuilder {
  private template: Partial<PromptTemplate>;
  private layers: PromptLayer[] = [];

  constructor(name: string, description: string) {
    this.template = {
      id: this.generateId(),
      name,
      description,
      version: '1.0.0',
      category: 'standard',
      layers: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        tags: []
      }
    };
  }

  setCategory(category: PromptTemplate['category']): PromptTemplateBuilder {
    this.template.category = category;
    return this;
  }

  setVersion(version: string): PromptTemplateBuilder {
    this.template.version = version;
    return this;
  }

  setAuthor(author: string): PromptTemplateBuilder {
    if (this.template.metadata) {
      this.template.metadata.author = author;
    }
    return this;
  }

  addTags(tags: string[]): PromptTemplateBuilder {
    if (this.template.metadata) {
      this.template.metadata.tags = [...(this.template.metadata.tags || []), ...tags];
    }
    return this;
  }

  addLayer(layer: PromptLayer): PromptTemplateBuilder {
    this.layers.push(layer);
    return this;
  }

  addSystemLayer(content: string, variables?: Record<string, any>): PromptTemplateBuilder {
    const layer = new PromptLayerBuilder('system', 'System Prompt', 1)
      .setContent(content)
      .addVariables(variables || {})
      .build();
    return this.addLayer(layer);
  }

  addContextLayer(content: string, variables?: Record<string, any>): PromptTemplateBuilder {
    const layer = new PromptLayerBuilder('context', 'Context/Task Prompt', 2)
      .setContent(content)
      .addVariables(variables || {})
      .build();
    return this.addLayer(layer);
  }

  addConstraintsLayer(content: string, variables?: Record<string, any>): PromptTemplateBuilder {
    const layer = new PromptLayerBuilder('constraints', 'Constraints & Rules', 3)
      .setContent(content)
      .addVariables(variables || {})
      .build();
    return this.addLayer(layer);
  }

  addReasoningLayer(content: string, variables?: Record<string, any>): PromptTemplateBuilder {
    const layer = new PromptLayerBuilder('reasoning', 'Chain of Thought', 4)
      .setContent(content)
      .addVariables(variables || {})
      .build();
    return this.addLayer(layer);
  }

  addCritiqueLayer(content: string, variables?: Record<string, any>): PromptTemplateBuilder {
    const layer = new PromptLayerBuilder('critique', 'Self-Critique', 5)
      .setContent(content)
      .addVariables(variables || {})
      .build();
    return this.addLayer(layer);
  }

  build(): PromptTemplate {
    // Sort layers by order
    this.layers.sort((a, b) => a.order - b.order);
    
    return {
      ...this.template as PromptTemplate,
      layers: this.layers
    };
  }

  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Template variable interpolation engine
 */
export class VariableInterpolator {
  /**
   * Interpolate variables in a text template
   * Supports both {{variable}} and {variable} syntax
   */
  static interpolate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Replace {{variable}} syntax
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match;
    });
    
    // Replace {variable} syntax
    result = result.replace(/\{(\w+)\}/g, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match;
    });
    
    return result;
  }

  /**
   * Extract variable names from a template
   */
  static extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract {{variable}} syntax
    const doubleMatches = template.match(/\{\{(\w+)\}\}/g);
    if (doubleMatches) {
      doubleMatches.forEach(match => {
        const variableName = match.replace(/\{\{|\}\}/g, '');
        variables.add(variableName);
      });
    }
    
    // Extract {variable} syntax
    const singleMatches = template.match(/\{(\w+)\}/g);
    if (singleMatches) {
      singleMatches.forEach(match => {
        const variableName = match.replace(/\{|\}/g, '');
        variables.add(variableName);
      });
    }
    
    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided
   */
  static validateVariables(template: string, variables: Record<string, any>): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const requiredVariables = this.extractVariables(template);
    const providedVariables = Object.keys(variables);
    const missingVariables = requiredVariables.filter(
      variable => !providedVariables.includes(variable)
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }
}

/**
 * Prompt composer that combines layers into a complete prompt
 */
export class PromptComposer {
  /**
   * Compose layers into a complete prompt string
   */
  static compose(template: PromptTemplate, variables: Record<string, any> = {}): string {
    const activeLayers = template.layers
      .filter(layer => layer.isActive)
      .sort((a, b) => a.order - b.order);

    const composedSections: string[] = [];

    for (const layer of activeLayers) {
      // Merge template variables with provided variables
      const layerVariables = { ...layer.variables, ...variables };
      
      // Interpolate variables in the layer content
      const interpolatedContent = VariableInterpolator.interpolate(
        layer.content, 
        layerVariables
      );

      if (interpolatedContent.trim()) {
        composedSections.push(interpolatedContent.trim());
      }
    }

    return composedSections.join('\n\n');
  }

  /**
   * Compose layers into structured sections
   */
  static composeStructured(
    template: PromptTemplate, 
    variables: Record<string, any> = {}
  ): GeneratedPrompt['layers'] {
    const activeLayers = template.layers
      .filter(layer => layer.isActive)
      .sort((a, b) => a.order - b.order);

    const sections: GeneratedPrompt['layers'] = {
      system: '',
      context: '',
      constraints: ''
    };

    for (const layer of activeLayers) {
      const layerVariables = { ...layer.variables, ...variables };
      const interpolatedContent = VariableInterpolator.interpolate(
        layer.content, 
        layerVariables
      );

      if (interpolatedContent.trim()) {
        switch (layer.type) {
          case 'system':
            sections.system = interpolatedContent.trim();
            break;
          case 'context':
            sections.context = interpolatedContent.trim();
            break;
          case 'constraints':
            sections.constraints = interpolatedContent.trim();
            break;
          case 'reasoning':
            sections.reasoning = interpolatedContent.trim();
            break;
          case 'critique':
            sections.critique = interpolatedContent.trim();
            break;
        }
      }
    }

    return sections;
  }

  /**
   * Estimate token count for a composed prompt
   */
  static estimateTokens(composedPrompt: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a simplified approach; in production, use a proper tokenizer
    const words = composedPrompt.split(/\s+/).filter(word => word.length > 0);
    const characters = composedPrompt.length;
    
    // Combined heuristic: average of word-based and character-based estimates
    const wordBasedTokens = words.length;
    const charBasedTokens = Math.ceil(characters / 4);
    
    return Math.max(wordBasedTokens, Math.ceil(charBasedTokens * 0.75));
  }

  /**
   * Validate a prompt template
   */
  static validateTemplate(template: PromptTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim() === '') {
      errors.push('Template description is required');
    }

    if (!template.layers || template.layers.length === 0) {
      errors.push('Template must have at least one layer');
    }

    // Check for required layer types
    const layerTypes = template.layers.map(layer => layer.type);
    if (!layerTypes.includes('system')) {
      errors.push('Template must have a system layer');
    }

    if (!layerTypes.includes('context')) {
      errors.push('Template must have a context layer');
    }

    // Check layer order consistency
    const activeLayers = template.layers.filter(layer => layer.isActive);
    if (activeLayers.length > 0) {
      const orders = activeLayers.map(layer => layer.order);
      const uniqueOrders = new Set(orders);
      if (orders.length !== uniqueOrders.size) {
        errors.push('Layer orders must be unique');
      }
    }

    // Validate variable usage in each layer
    for (const layer of template.layers) {
      const validation = VariableInterpolator.validateVariables(
        layer.content, 
        layer.variables || {}
      );
      
      if (!validation.isValid) {
        errors.push(`Layer "${layer.name}" has missing variables: ${validation.missingVariables.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
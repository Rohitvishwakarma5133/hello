import {
  ReasoningPattern,
  GeneratedPrompt,
  PromptConfiguration,
  TextChunk
} from '../interfaces/prompt-interfaces';

/**
 * Advanced Reasoning Pattern Manager
 * Implements Chain-of-Thought, Self-Consistency, and Self-Critique techniques
 * Based on Stage 2.1 requirements for premium prompt engineering
 */
export class AdvancedReasoningManager {
  
  /**
   * Apply Chain-of-Thought reasoning to a prompt
   * Forces the LLM to think step-by-step before generating output
   */
  static applyChainOfThought(
    basePrompt: GeneratedPrompt,
    steps?: string[]
  ): GeneratedPrompt {
    const defaultSteps = [
      'Analyze the input text to identify its core message, key arguments, and existing sentence patterns',
      'Formulate a specific plan for how you will modify the sentence structures, vocabulary, and flow to meet the humanization requirements',
      'Execute the rewrite based on your plan while maintaining the original meaning'
    ];

    const cotSteps = steps || defaultSteps;
    
    const reasoningLayer = `CHAIN-OF-THOUGHT ANALYSIS:

Let's think step by step. Before providing the final rewritten text, perform the following analysis:

${cotSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

This structured reasoning process leads to a more thoughtful and higher-quality transformation. Take your time with each step before proceeding to the actual rewrite.`;

    return {
      ...basePrompt,
      id: `${basePrompt.id}_cot`,
      layers: {
        ...basePrompt.layers,
        reasoning: reasoningLayer
      },
      fullPrompt: this.reconstructFullPrompt(basePrompt, { reasoning: reasoningLayer })
    };
  }

  /**
   * Apply Self-Consistency pattern
   * Generates multiple versions and selects the best one
   */
  static applySelfConsistency(
    basePrompt: GeneratedPrompt,
    iterations: number = 3,
    selectionCriteria?: string[]
  ): GeneratedPrompt {
    const defaultCriteria = [
      'Natural sentence flow and variety',
      'Vocabulary richness and appropriateness', 
      'Overall human-likeness',
      'Preservation of original meaning',
      'Absence of robotic patterns'
    ];

    const criteria = selectionCriteria || defaultCriteria;

    const selfConsistencyLayer = `SELF-CONSISTENCY APPROACH:

Generate ${iterations} distinct versions of the rewritten text, each with different approaches to humanization:

Version A: Focus on sentence structure variation and natural rhythm
Version B: Emphasize vocabulary enrichment and synonym replacement  
Version C: Prioritize idiomatic expressions and natural flow
${iterations > 3 ? 'Version D: Combine the best elements from previous approaches' : ''}

SELECTION CRITERIA:
Evaluate each version based on:
${criteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}

FINAL SELECTION:
After generating all versions, compare them systematically and select the version that best balances all criteria. Present only the selected version as your final output.`;

    return {
      ...basePrompt,
      id: `${basePrompt.id}_sc`,
      layers: {
        ...basePrompt.layers,
        reasoning: selfConsistencyLayer
      },
      fullPrompt: this.reconstructFullPrompt(basePrompt, { reasoning: selfConsistencyLayer })
    };
  }

  /**
   * Apply Self-Critique pattern
   * Adds a review and refinement step
   */
  static applySelfCritique(
    basePrompt: GeneratedPrompt,
    critiquePoints?: string[]
  ): GeneratedPrompt {
    const defaultPoints = [
      'Does it sound natural and engaging?',
      'Is the sentence structure sufficiently varied?',
      'Is the vocabulary rich but appropriate?',
      'Are there any remaining robotic patterns?',
      'Does it maintain the original meaning while improving human-likeness?'
    ];

    const points = critiquePoints || defaultPoints;

    const critiqueLayer = `SELF-CRITIQUE AND REFINEMENT:

After generating your rewritten text, perform a comprehensive self-review:

QUALITY ASSESSMENT:
${points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

REFINEMENT PROCESS:
If you identify any areas that still sound robotic, formulaic, or unnatural:
1. Pinpoint the specific issues
2. Apply targeted improvements
3. Ensure the refined version flows naturally

FINAL CHECK:
Ensure your output represents the most human-like version possible while preserving all original meaning and context.

Present only your final, refined version.`;

    return {
      ...basePrompt,
      id: `${basePrompt.id}_critique`,
      layers: {
        ...basePrompt.layers,
        critique: critiqueLayer
      },
      fullPrompt: this.reconstructFullPrompt(basePrompt, { critique: critiqueLayer })
    };
  }

  /**
   * Apply Step-Back prompting
   * Encourages higher-level thinking before specific execution
   */
  static applyStepBackPrompting(
    basePrompt: GeneratedPrompt,
    contextQuestions?: string[]
  ): GeneratedPrompt {
    const defaultQuestions = [
      'What are the key characteristics that make text sound human-written versus AI-generated?',
      'What specific linguistic patterns should I avoid to prevent AI detection?',
      'How can I balance creativity with maintaining the original meaning?',
      'What writing techniques will make this text most engaging for human readers?'
    ];

    const questions = contextQuestions || defaultQuestions;

    const stepBackLayer = `STEP-BACK ANALYSIS:

Before beginning the rewrite, step back and consider these fundamental questions:

${questions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

STRATEGIC APPROACH:
Based on your analysis of these questions, develop a comprehensive strategy for humanizing this specific text. Consider:
- The text's current weaknesses that suggest AI authorship
- The most effective humanization techniques for this content type
- How to maintain authenticity while maximizing natural variation

Only after completing this strategic analysis should you proceed with the actual rewriting task.`;

    return {
      ...basePrompt,
      id: `${basePrompt.id}_stepback`,
      layers: {
        ...basePrompt.layers,
        reasoning: stepBackLayer
      },
      fullPrompt: this.reconstructFullPrompt(basePrompt, { reasoning: stepBackLayer })
    };
  }

  /**
   * Combine multiple reasoning patterns for maximum effectiveness
   */
  static applyCombinedReasoning(
    basePrompt: GeneratedPrompt,
    patterns: ReasoningPattern[]
  ): GeneratedPrompt {
    let enhancedPrompt = { ...basePrompt };

    for (const pattern of patterns) {
      if (!pattern.enabled) continue;

      switch (pattern.type) {
        case 'chain-of-thought':
          enhancedPrompt = this.applyChainOfThought(
            enhancedPrompt, 
            pattern.parameters.steps
          );
          break;
        case 'self-consistency':
          enhancedPrompt = this.applySelfConsistency(
            enhancedPrompt,
            pattern.parameters.iterations || 3,
            pattern.parameters.criteriа
          );
          break;
        case 'self-critique':
          enhancedPrompt = this.applySelfCritique(
            enhancedPrompt,
            pattern.parameters.criteriа
          );
          break;
        case 'step-back':
          enhancedPrompt = this.applyStepBackPrompting(
            enhancedPrompt,
            pattern.parameters.steps
          );
          break;
      }
    }

    return {
      ...enhancedPrompt,
      id: `${basePrompt.id}_combined`
    };
  }

  /**
   * Create a premium reasoning configuration
   * Combines Chain-of-Thought and Self-Critique for premium users
   */
  static createPremiumReasoningPattern(): ReasoningPattern[] {
    return [
      {
        type: 'chain-of-thought',
        enabled: true,
        parameters: {
          steps: [
            'Identify the current text characteristics that suggest AI authorship (repetitive patterns, predictable vocabulary, uniform sentence structure)',
            'Analyze the content type and determine the most appropriate humanization strategy',
            'Plan specific modifications: sentence restructuring, vocabulary enhancement, natural flow improvements',
            'Consider the target audience and adjust tone/style appropriately',
            'Execute the transformation while maintaining semantic integrity'
          ]
        }
      },
      {
        type: 'self-critique',
        enabled: true,
        parameters: {
          criteriа: [
            'Natural variation in sentence length and structure',
            'Rich but appropriate vocabulary choices',
            'Absence of AI detection triggers',
            'Maintained original meaning and context',
            'Engaging and human-like tone'
          ]
        }
      }
    ];
  }

  /**
   * Create experimental reasoning configuration
   * Uses self-consistency for highest quality output
   */
  static createExperimentalReasoningPattern(): ReasoningPattern[] {
    return [
      {
        type: 'step-back',
        enabled: true,
        parameters: {
          steps: [
            'What makes this text obviously AI-generated?',
            'What humanization techniques will be most effective here?',
            'How can I maximize linguistic unpredictability while preserving meaning?'
          ]
        }
      },
      {
        type: 'self-consistency',
        enabled: true,
        parameters: {
          iterations: 3,
          criteriа: [
            'Maximum human-likeness score',
            'Optimal perplexity and burstiness',
            'Maintained semantic integrity',
            'Natural readability and flow'
          ]
        }
      },
      {
        type: 'self-critique',
        enabled: true,
        parameters: {
          criteriа: [
            'Would a human write this exact text?',
            'Are there any remaining formulaic patterns?',
            'Is the vocabulary naturally varied?',
            'Does the text flow with human-like rhythm?'
          ]
        }
      }
    ];
  }

  /**
   * Analyze text to recommend reasoning patterns
   */
  static recommendReasoningPatterns(
    textChunk: TextChunk,
    userContext: { isPremium: boolean; selectedMode: string }
  ): ReasoningPattern[] {
    // Basic pattern for all users
    const basicPatterns: ReasoningPattern[] = [
      {
        type: 'chain-of-thought',
        enabled: true,
        parameters: {
          steps: [
            'Analyze the text structure and identify improvement opportunities',
            'Plan vocabulary and sentence structure modifications',
            'Execute the rewrite with natural human variation'
          ]
        }
      }
    ];

    // Premium patterns
    if (userContext.isPremium && userContext.selectedMode === 'personal-touch') {
      // High-quality content gets experimental treatment
      if (textChunk.tokenCount > 200) {
        return this.createExperimentalReasoningPattern();
      }
      
      return this.createPremiumReasoningPattern();
    }

    return basicPatterns;
  }

  /**
   * Reconstruct full prompt with updated layers
   */
  private static reconstructFullPrompt(
    basePrompt: GeneratedPrompt,
    layerUpdates: Partial<GeneratedPrompt['layers']>
  ): string {
    const updatedLayers = { ...basePrompt.layers, ...layerUpdates };
    
    const sections: string[] = [];
    
    if (updatedLayers.system) sections.push(updatedLayers.system);
    if (updatedLayers.context) sections.push(updatedLayers.context);
    if (updatedLayers.constraints) sections.push(updatedLayers.constraints);
    if (updatedLayers.reasoning) sections.push(updatedLayers.reasoning);
    if (updatedLayers.critique) sections.push(updatedLayers.critique);
    
    return sections.join('\n\n');
  }
}

/**
 * Reasoning Pattern Factory
 * Creates specific reasoning patterns for different scenarios
 */
export class ReasoningPatternFactory {
  
  /**
   * Create reasoning pattern for academic content
   */
  static createAcademicReasoning(): ReasoningPattern[] {
    return [
      {
        type: 'chain-of-thought',
        enabled: true,
        parameters: {
          steps: [
            'Identify formulaic academic phrases and rigid structures',
            'Plan how to vary academic language while maintaining scholarly authority',
            'Consider discipline-specific vocabulary alternatives',
            'Execute rewrite with natural academic variation'
          ]
        }
      },
      {
        type: 'self-critique',
        enabled: true,
        parameters: {
          criteriа: [
            'Does it maintain scholarly rigor?',
            'Is the academic language naturally varied?',
            'Are citations integrated smoothly?',
            'Does it sound like expert human authorship?'
          ]
        }
      }
    ];
  }

  /**
   * Create reasoning pattern for creative content
   */
  static createCreativeReasoning(): ReasoningPattern[] {
    return [
      {
        type: 'step-back',
        enabled: true,
        parameters: {
          steps: [
            'What emotional tone should this creative piece convey?',
            'How can I add more sensory details and imagery?',
            'What makes creative writing feel authentically human?'
          ]
        }
      },
      {
        type: 'chain-of-thought',
        enabled: true,
        parameters: {
          steps: [
            'Analyze the creative elements and narrative flow',
            'Plan enhancements for imagery, rhythm, and voice',
            'Execute rewrite with creative human flair'
          ]
        }
      }
    ];
  }

  /**
   * Create reasoning pattern for business content
   */
  static createBusinessReasoning(): ReasoningPattern[] {
    return [
      {
        type: 'chain-of-thought',
        enabled: true,
        parameters: {
          steps: [
            'Identify corporate jargon and robotic business language',
            'Plan how to maintain professionalism while adding human warmth',
            'Consider the business audience and appropriate tone',
            'Execute rewrite with authentic professional voice'
          ]
        }
      },
      {
        type: 'self-critique',
        enabled: true,
        parameters: {
          criteriа: [
            'Does it sound like genuine business expertise?',
            'Is the professional tone maintained without robotic language?',
            'Would this connect with business readers?',
            'Is the communication clear and engaging?'
          ]
        }
      }
    ];
  }
}
import { PromptTemplate } from '../interfaces/prompt-interfaces';
import { PromptTemplateBuilder } from '../core/prompt-template';

/**
 * Factory class for creating predefined humanization prompt templates
 * Based on the requirements from Stage 2.1 - Dynamic and Layered Prompt Engineering
 */
export class HumanizationPromptFactory {

  /**
   * Creates the standard humanization template for default users
   * Based on the foundational prompt architecture from the requirements
   */
  static createStandardTemplate(): PromptTemplate {
    const systemPrompt = `You are an expert American editor and creative writer, renowned for your ability to transform technical and robotic text into engaging, fluid, and natural-sounding prose. Your writing style is characterized by its rich vocabulary and varied sentence structures.`;

    const contextPrompt = `Your task is to rewrite the user-provided text that follows. The primary objective is to make the final output indistinguishable from content written by a human. To achieve this, you must significantly increase the text's perplexity (linguistic unpredictability) and burstiness (sentence structure variation) to ensure it can pass all modern AI detection tools.

TEXT TO REWRITE:
{textContent}`;

    const constraintsPrompt = `HUMANIZATION REQUIREMENTS:

1. **Sentence Structure:** You must rewrite the text to include a dynamic mix of sentence structures (simple, compound, complex). The length of consecutive sentences must vary significantly. Avoid repetitive sentence starters. For example, do not start multiple sentences in a row with a pronoun followed by a verb.

2. **Vocabulary:** Replace generic and overused words with more precise and descriptive synonyms. Introduce nuanced vocabulary where appropriate, but strictly maintain the original meaning.

3. **Idiomatic Language:** Where it feels natural and does not detract from the core message, subtly incorporate common idiomatic expressions. The goal is to make the text sound less formal and more like it was written by a native speaker for a knowledgeable audience.

4. **Flow:** Maintain the logical flow of the original argument. Ensure that transitions between sentences and ideas are smooth and natural. You may rephrase logical connectors (e.g., 'therefore', 'however') to improve the narrative rhythm.`;

    return new PromptTemplateBuilder(
      'Standard Humanization Template',
      'Basic humanization template for default users with core evasion techniques'
    )
      .setCategory('standard')
      .setAuthor('AI Humanizer System')
      .addTags(['humanization', 'evasion', 'standard'])
      .addSystemLayer(systemPrompt)
      .addContextLayer(contextPrompt, { textContent: '{textContent}' })
      .addConstraintsLayer(constraintsPrompt)
      .build();
  }

  /**
   * Creates the premium humanization template with advanced reasoning
   * Includes Chain-of-Thought and Self-Critique for premium users
   */
  static createPremiumTemplate(): PromptTemplate {
    const systemPrompt = `You are an expert American editor and creative writer, renowned for your ability to transform technical and robotic text into engaging, fluid, and natural-sounding prose. Your writing style is characterized by its rich vocabulary and varied sentence structures. You approach each rewriting task with analytical precision and creative flair.`;

    const contextPrompt = `Your task is to rewrite the user-provided text that follows. The primary objective is to make the final output indistinguishable from content written by a human. To achieve this, you must significantly increase the text's perplexity (linguistic unpredictability) and burstiness (sentence structure variation) to ensure it can pass all modern AI detection tools.

TEXT TO REWRITE:
{textContent}`;

    const constraintsPrompt = `HUMANIZATION REQUIREMENTS:

1. **Sentence Structure:** You must rewrite the text to include a dynamic mix of sentence structures (simple, compound, complex). The length of consecutive sentences must vary significantly. Avoid repetitive sentence starters. For example, do not start multiple sentences in a row with a pronoun followed by a verb.

2. **Vocabulary:** Replace generic and overused words (e.g., 'utilize', 'leverage', 'in order to', 'very', 'important') with more precise and descriptive synonyms. Introduce nuanced and sophisticated vocabulary where it is appropriate for the context, but you must strictly maintain the original meaning and overall readability of the text.

3. **Idiomatic Language:** Where it feels natural and does not detract from the core message, subtly incorporate common idiomatic expressions. The goal is to make the text sound less formal and more like it was written by a native speaker for a knowledgeable audience.

4. **Flow:** Maintain the logical flow of the original argument. Ensure that transitions between sentences and ideas are smooth and natural. You may rephrase logical connectors (e.g., 'therefore', 'however') to improve the narrative rhythm.`;

    const reasoningPrompt = `ANALYTICAL APPROACH:

Let's think step by step. Before providing the final rewritten text, first, analyze the input text to identify its core message and existing patterns. Second, formulate a specific plan for how you will modify the text to meet all the above constraints. Third, execute the rewrite based on your plan.

Before you provide the final rewritten text, first perform the following steps silently:
1. Analyze the input text to identify its core message, key arguments, and existing sentence patterns.
2. Formulate a specific plan for how you will modify the sentence structures, vocabulary, and flow to meet the humanization requirements.
3. Only after completing these steps, execute the rewrite based on your plan.

This structured reasoning process leads to a more thoughtful and higher-quality transformation.`;

    const critiquePrompt = `QUALITY ASSURANCE:

After you have generated the rewritten text, perform a final review. Does it sound natural and engaging? Is the sentence structure sufficiently varied? Is the vocabulary rich but appropriate? If you identify any areas that still sound robotic, make one final pass to refine them.

Ensure your final output maintains the original meaning while dramatically improving its human-likeness through varied sentence structures, sophisticated vocabulary, and natural flow.`;

    return new PromptTemplateBuilder(
      'Premium Humanization Template',
      'Advanced humanization template with Chain-of-Thought and Self-Critique for premium users'
    )
      .setCategory('premium')
      .setAuthor('AI Humanizer System')
      .addTags(['humanization', 'evasion', 'premium', 'chain-of-thought', 'self-critique'])
      .addSystemLayer(systemPrompt)
      .addContextLayer(contextPrompt, { textContent: '{textContent}' })
      .addConstraintsLayer(constraintsPrompt)
      .addReasoningLayer(reasoningPrompt)
      .addCritiqueLayer(critiquePrompt)
      .build();
  }

  /**
   * Creates an academic-focused humanization template
   * Specialized for academic and technical content
   */
  static createAcademicTemplate(): PromptTemplate {
    const systemPrompt = `You are an expert academic editor and scholar, renowned for your ability to transform rigid, formulaic academic writing into engaging, sophisticated prose that maintains scholarly rigor while exhibiting natural human variation. Your expertise spans multiple disciplines and you understand how genuine academic writing varies in structure and style.`;

    const contextPrompt = `Your task is to rewrite the academic text provided below. The objective is to maintain the scholarly tone and precision while making the writing appear naturally human-authored. Academic AI detection tools specifically look for formulaic structures and predictable academic phrases.

ACADEMIC TEXT TO REWRITE:
{textContent}`;

    const constraintsPrompt = `ACADEMIC HUMANIZATION REQUIREMENTS:

1. **Sentence Complexity:** Vary between shorter, punchy statements and longer, complex sentences with multiple clauses. Academic writing should breathe, not suffocate with uniformity.

2. **Academic Vocabulary:** Replace overused academic phrases like "it is important to note," "in conclusion," "furthermore," with more sophisticated and varied transitions. Use discipline-specific terminology naturally.

3. **Argument Structure:** Maintain logical flow while varying how arguments are presented. Sometimes use direct statements, other times build up to conclusions through evidence.

4. **Citation Integration:** If citations exist, ensure they feel naturally integrated rather than mechanically inserted.

5. **Scholarly Voice:** Preserve authority while adding subtle human touches that show expertise and confidence in the subject matter.`;

    return new PromptTemplateBuilder(
      'Academic Humanization Template',
      'Specialized template for academic and scholarly content'
    )
      .setCategory('premium')
      .setAuthor('AI Humanizer System')
      .addTags(['humanization', 'academic', 'scholarly', 'technical'])
      .addSystemLayer(systemPrompt)
      .addContextLayer(contextPrompt, { textContent: '{textContent}' })
      .addConstraintsLayer(constraintsPrompt)
      .build();
  }

  /**
   * Creates a creative writing humanization template
   * Optimized for creative and narrative content
   */
  static createCreativeTemplate(): PromptTemplate {
    const systemPrompt = `You are a masterful creative writer and storyteller, known for your ability to breathe life into flat, mechanical prose. Your writing captivates readers through vivid imagery, varied rhythm, and authentic voice. You understand that creative writing should feel organic and unpredictable.`;

    const contextPrompt = `Your task is to rewrite the creative text below, transforming it from robotic prose into compelling, human-authored writing. Focus on creating natural variation, emotional resonance, and stylistic flair while preserving the core narrative or message.

CREATIVE TEXT TO REWRITE:
{textContent}`;

    const constraintsPrompt = `CREATIVE HUMANIZATION REQUIREMENTS:

1. **Rhythm and Flow:** Create a natural cadence with sentences that ebb and flow like human speech. Mix short, impactful sentences with longer, flowing passages.

2. **Sensory Details:** Where appropriate, enhance descriptions with sensory elements that make the writing more vivid and engaging.

3. **Voice and Tone:** Establish a distinct, authentic voice that feels genuinely human. Avoid generic or formulaic expressions.

4. **Emotional Resonance:** Infuse the writing with appropriate emotional undertones that connect with readers on a human level.

5. **Creative Language:** Use metaphors, similes, and creative language naturally. Avoid clichés while embracing fresh, unexpected expressions.`;

    return new PromptTemplateBuilder(
      'Creative Humanization Template',
      'Template optimized for creative and narrative content'
    )
      .setCategory('premium')
      .setAuthor('AI Humanizer System')
      .addTags(['humanization', 'creative', 'narrative', 'storytelling'])
      .addSystemLayer(systemPrompt)
      .addContextLayer(contextPrompt, { textContent: '{textContent}' })
      .addConstraintsLayer(constraintsPrompt)
      .build();
  }

  /**
   * Creates a business/professional humanization template
   * Tailored for business communication and professional content
   */
  static createBusinessTemplate(): PromptTemplate {
    const systemPrompt = `You are an expert business writer and communications specialist, skilled at transforming corporate jargon and formulaic business writing into clear, engaging professional communication. You understand how to maintain professionalism while adding human warmth and authenticity.`;

    const contextPrompt = `Your task is to rewrite the business text provided below. Transform corporate speak and robotic professional writing into authentic, human-centered business communication that maintains professionalism while feeling genuinely authored by a knowledgeable professional.

BUSINESS TEXT TO REWRITE:
{textContent}`;

    const constraintsPrompt = `BUSINESS HUMANIZATION REQUIREMENTS:

1. **Professional Tone:** Maintain appropriate business formality while eliminating robotic corporate speak and buzzwords.

2. **Clear Communication:** Replace jargon and unnecessarily complex phrases with clearer, more direct language that still sounds professional.

3. **Human Connection:** Add subtle elements that show genuine human insight and experience in business contexts.

4. **Varied Structure:** Mix different sentence structures to avoid the monotonous rhythm common in corporate communications.

5. **Authentic Voice:** Create writing that sounds like it comes from a real professional with genuine expertise, not a template or AI system.`;

    return new PromptTemplateBuilder(
      'Business Humanization Template',
      'Template for business and professional communication'
    )
      .setCategory('standard')
      .setAuthor('AI Humanizer System')
      .addTags(['humanization', 'business', 'professional', 'corporate'])
      .addSystemLayer(systemPrompt)
      .addContextLayer(contextPrompt, { textContent: '{textContent}' })
      .addConstraintsLayer(constraintsPrompt)
      .build();
  }

  /**
   * Creates an experimental template with self-consistency
   * Uses multiple generation attempts for highest quality
   */
  static createSelfConsistencyTemplate(): PromptTemplate {
    const systemPrompt = `You are an expert editor with exceptional quality control standards. You have the unique ability to generate multiple versions of rewritten text and select the best one. Your goal is to produce the most human-like, natural text possible through careful comparison and selection.`;

    const contextPrompt = `Your task is to rewrite the text below using a self-consistency approach. You will generate multiple variations and then select the best one that most effectively evades AI detection while maintaining the original meaning.

TEXT TO REWRITE:
{textContent}`;

    const constraintsPrompt = `SELF-CONSISTENCY REQUIREMENTS:

1. **Multiple Variations:** Internally generate 2-3 distinct rewritten versions of the text, each with different approaches to sentence structure and vocabulary.

2. **Quality Assessment:** Evaluate each version for:
   - Natural sentence flow and variety
   - Vocabulary richness and appropriateness
   - Overall human-likeness
   - Preservation of original meaning

3. **Best Selection:** Choose the version that best balances all requirements and presents the most convincing human authorship.

4. **Final Polish:** Make any final refinements to the selected version to maximize its human-like qualities.`;

    const reasoningPrompt = `SELF-CONSISTENCY PROCESS:

First, generate Version A with focus on sentence structure variation.
Second, generate Version B with emphasis on vocabulary enrichment.
Third, generate Version C with attention to natural flow and idiomatic expression.
Finally, compare all versions and select the most human-like result, making final refinements as needed.`;

    return new PromptTemplateBuilder(
      'Self-Consistency Humanization Template',
      'Experimental template using multiple generations for optimal quality'
    )
      .setCategory('experimental')
      .setAuthor('AI Humanizer System')
      .addTags(['humanization', 'experimental', 'self-consistency', 'quality'])
      .addSystemLayer(systemPrompt)
      .addContextLayer(contextPrompt, { textContent: '{textContent}' })
      .addConstraintsLayer(constraintsPrompt)
      .addReasoningLayer(reasoningPrompt)
      .build();
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): PromptTemplate[] {
    return [
      this.createStandardTemplate(),
      this.createPremiumTemplate(),
      this.createAcademicTemplate(),
      this.createCreativeTemplate(),
      this.createBusinessTemplate(),
      this.createSelfConsistencyTemplate()
    ];
  }

  /**
   * Get template by category
   */
  static getTemplatesByCategory(category: 'standard' | 'premium' | 'experimental'): PromptTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  /**
   * Get template by content type
   */
  static getTemplateByContentType(
    contentType: 'general' | 'academic' | 'creative' | 'business' | 'technical',
    isPremium: boolean = false
  ): PromptTemplate {
    switch (contentType) {
      case 'academic':
      case 'technical':
        return this.createAcademicTemplate();
      case 'creative':
        return this.createCreativeTemplate();
      case 'business':
        return this.createBusinessTemplate();
      case 'general':
      default:
        return isPremium ? this.createPremiumTemplate() : this.createStandardTemplate();
    }
  }
}

/**
 * Constants for prompt engineering based on the requirements document
 */
export const HUMANIZATION_CONSTANTS = {
  // Generic and overused words to avoid (from requirements)
  GENERIC_WORDS: [
    'utilize', 'leverage', 'in order to', 'very', 'important', 
    'significant', 'substantial', 'furthermore', 'moreover',
    'therefore', 'however', 'nonetheless', 'consequently'
  ],

  // Common AI detection patterns to avoid
  AI_PATTERNS: [
    'It is important to note that',
    'In conclusion,',
    'Furthermore,',
    'Additionally,',
    'Moreover,',
    'On the other hand,',
    'As a result,',
    'In summary,'
  ],

  // Sentence starters to vary (from requirements)
  REPETITIVE_STARTERS: [
    'The', 'This', 'It', 'They', 'We', 'You', 'I'
  ],

  // Quality thresholds
  QUALITY_THRESHOLDS: {
    MIN_SENTENCE_VARIETY: 0.7,
    MIN_VOCABULARY_RICHNESS: 0.6,
    MIN_NATURALNESS: 0.8
  }
} as const;
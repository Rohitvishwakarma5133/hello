import { EmbeddingService } from '../interfaces/chunking-interfaces';

/**
 * Mock Embedding Service for development and testing
 * In production, this would integrate with actual embedding models like:
 * - OpenAI Ada-002
 * - Sentence Transformers
 * - Cohere Embed
 * - Google Universal Sentence Encoder
 */
export class MockEmbeddingService implements EmbeddingService {
  private readonly embeddingDimension = 384; // Standard for many models
  private readonly cache = new Map&lt;string, number[]&gt;();

  /**
   * Generate a mock embedding for text
   * This is a simplified implementation for development
   * Production would use actual transformer models
   */
  async generateEmbedding(text: string): Promise&lt;number[]&gt; {
    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Generate pseudo-embedding based on text characteristics
    const embedding = this.createPseudoEmbedding(text);
    
    // Cache the result
    this.cache.set(cacheKey, embedding);
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    const dotProduct = this.dotProduct(embedding1, embedding2);
    const magnitude1 = this.magnitude(embedding1);
    const magnitude2 = this.magnitude(embedding2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Calculate cosine distance (1 - cosine similarity)
   */
  calculateCosineDistance(embedding1: number[], embedding2: number[]): number {
    return 1 - this.calculateCosineSimilarity(embedding1, embedding2);
  }

  /**
   * Create a pseudo-embedding based on text characteristics
   * This simulates semantic meaning by analyzing:
   * - Word frequency
   * - Sentence structure
   * - Common patterns
   * - Topic indicators
   */
  private createPseudoEmbedding(text: string): number[] {
    const normalized = text.toLowerCase().trim();
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    // Analyze text characteristics
    const words = normalized.split(/\s+/);
    const sentences = text.split(/[.!?]+/);
    const wordCount = words.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
    const sentenceCount = sentences.length;
    
    // Topic-based features (simulate semantic clusters)
    const topicKeywords = {
      technical: ['system', 'algorithm', 'data', 'process', 'method', 'function', 'code', 'implementation'],
      business: ['customer', 'market', 'revenue', 'strategy', 'growth', 'profit', 'business', 'client'],
      academic: ['research', 'study', 'analysis', 'hypothesis', 'conclusion', 'evidence', 'theory', 'findings'],
      creative: ['story', 'character', 'narrative', 'plot', 'creative', 'artistic', 'design', 'aesthetic']
    };

    let topicIndex = 0;
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const topicScore = keywords.reduce((score, keyword) => {
        return score + (normalized.includes(keyword) ? 1 : 0);
      }, 0) / keywords.length;
      
      // Distribute topic scores across embedding dimensions
      for (let i = 0; i < this.embeddingDimension / 4; i++) {
        embedding[topicIndex * (this.embeddingDimension / 4) + i] = topicScore;
      }
      topicIndex++;
    }

    // Structural features
    const structuralStartIndex = Math.floor(this.embeddingDimension * 0.7);
    embedding[structuralStartIndex] = Math.min(wordCount / 100, 1); // Normalized word count
    embedding[structuralStartIndex + 1] = Math.min(avgWordLength / 10, 1); // Normalized avg word length
    embedding[structuralStartIndex + 2] = Math.min(sentenceCount / 20, 1); // Normalized sentence count
    embedding[structuralStartIndex + 3] = this.calculateReadabilityScore(normalized); // Readability

    // Add some randomness to simulate embedding variability
    const seed = this.hashString(normalized);
    const random = this.seededRandom(seed);
    
    for (let i = 0; i < embedding.length; i++) {
      // Add small random component (±10% of base value)
      const randomFactor = 0.8 + 0.4 * random();
      embedding[i] = Math.max(-1, Math.min(1, embedding[i] * randomFactor));
    }

    // Normalize the embedding to unit vector
    return this.normalize(embedding);
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private magnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  private normalize(vector: number[]): number[] {
    const mag = this.magnitude(vector);
    return mag === 0 ? vector : vector.map(val => val / mag);
  }

  private calculateReadabilityScore(text: string): number {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0) / words.length;
    
    // Simplified Flesch-Kincaid-like score, normalized to 0-1
    const complexity = (avgWordsPerSentence * 0.1) + (avgSyllablesPerWord * 0.2);
    return Math.min(1, complexity / 5);
  }

  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (const char of word.toLowerCase()) {
      const isVowel = vowels.includes(char);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    return Math.max(1, count);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let x = seed;
    return function() {
      x = (x * 9301 + 49297) % 233280;
      return x / 233280;
    };
  }

  private getCacheKey(text: string): string {
    // Create a cache key that's shorter than the full text
    // but unique enough to avoid collisions
    const hash = this.hashString(text);
    const length = text.length;
    const firstWords = text.split(/\s+/).slice(0, 3).join(' ');
    return `${hash}_${length}_${firstWords}`;
  }

  /**
   * Clear the embedding cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 1000 // Could be configurable
    };
  }
}

/**
 * Production Embedding Service Interface
 * This would be implemented to connect to real embedding services
 */
export interface ProductionEmbeddingService extends EmbeddingService {
  /**
   * Batch process multiple texts for efficiency
   */
  generateEmbeddings(texts: string[]): Promise&lt;number[][]&gt;;
  
  /**
   * Get model information
   */
  getModelInfo(): {
    name: string;
    dimension: number;
    maxTokens: number;
  };
  
  /**
   * Health check for the embedding service
   */
  healthCheck(): Promise&lt;boolean&gt;;
}
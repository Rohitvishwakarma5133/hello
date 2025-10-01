import { ChunkingConfig } from '../interfaces/chunking-interfaces';

/**
 * Default configurations for different chunking scenarios
 */
export class ChunkingConfigFactory {
  /**
   * Default configuration for standard recursive chunking
   */
  static getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 500,
      overlapPercentage: 15,
      minChunkSize: 50,
      maxChunkSize: 800,
      separators: ['\n\n', '\n', '. ', ' ', ''],
      semanticThreshold: 0.3
    };
  }

  /**
   * Configuration optimized for personal touch mode (premium users)
   */
  static getPersonalTouchConfig(): ChunkingConfig {
    return {
      maxTokens: 400,
      overlapPercentage: 20,
      minChunkSize: 80,
      maxChunkSize: 600,
      separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''],
      semanticThreshold: 0.25  // More sensitive to semantic boundaries
    };
  }

  /**
   * Configuration for large documents (fallback for oversized content)
   */
  static getLargeDocumentConfig(): ChunkingConfig {
    return {
      maxTokens: 800,
      overlapPercentage: 10,
      minChunkSize: 100,
      maxChunkSize: 1200,
      separators: ['\n\n\n', '\n\n', '\n', '. ', ' '],
      semanticThreshold: 0.4
    };
  }

  /**
   * Configuration for small/short documents
   */
  static getSmallDocumentConfig(): ChunkingConfig {
    return {
      maxTokens: 250,
      overlapPercentage: 25,
      minChunkSize: 30,
      maxChunkSize: 400,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' '],
      semanticThreshold: 0.2
    };
  }

  /**
   * Get configuration based on text length and user context
   */
  static getOptimalConfig(textLength: number, isPremium: boolean, mode: string): ChunkingConfig {
    const tokenCount = Math.ceil(textLength / 4); // Rough estimation

    if (tokenCount < 500) {
      return ChunkingConfigFactory.getSmallDocumentConfig();
    } else if (tokenCount > 5000) {
      return ChunkingConfigFactory.getLargeDocumentConfig();
    } else if (isPremium && mode === 'personal-touch') {
      return ChunkingConfigFactory.getPersonalTouchConfig();
    } else {
      return ChunkingConfigFactory.getDefaultConfig();
    }
  }
}

/**
 * Constants for chunking system
 */
export const ChunkingConstants = {
  // Semantic analysis thresholds
  SEMANTIC_DISTANCE_PERCENTILE: 95,
  MIN_SEMANTIC_SIMILARITY: 0.1,
  MAX_SEMANTIC_SIMILARITY: 0.9,
  
  // Token limits
  ABSOLUTE_MAX_TOKENS: 2000,
  ABSOLUTE_MIN_TOKENS: 10,
  
  // Overlap constraints
  MIN_OVERLAP_PERCENTAGE: 5,
  MAX_OVERLAP_PERCENTAGE: 30,
  
  // Performance limits
  MAX_CHUNKS_FOR_SEMANTIC_ANALYSIS: 100,
  SEMANTIC_ANALYSIS_TIMEOUT_MS: 30000,
  
  // Default separators in order of preference
  DEFAULT_SEPARATORS: [
    '\n\n\n',    // Multiple line breaks (section breaks)
    '\n\n',      // Paragraph breaks
    '\n',        // Line breaks
    '. ',        // Sentence endings with space
    '! ',        // Exclamation with space
    '? ',        // Question with space
    '; ',        // Semicolon with space
    ', ',        // Comma with space
    ' ',         // Word boundaries
    ''           // Character level (fallback)
  ] as const,
  
  // Semantic chunking specific
  DEFAULT_EMBEDDING_MODEL: 'sentence-transformers',
  BATCH_SIZE_FOR_EMBEDDINGS: 10
} as const;
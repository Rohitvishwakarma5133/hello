/**
 * Represents a text chunk with metadata
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

/**
 * Configuration for chunking strategies
 */
export interface ChunkingConfig {
  maxTokens: number;
  overlapPercentage: number;
  minChunkSize: number;
  maxChunkSize: number;
  separators: string[];
  semanticThreshold?: number;
}

/**
 * User context for determining chunking strategy
 */
export interface UserContext {
  isPremium: boolean;
  selectedMode: 'default' | 'personal-touch';
  userId: string;
}

/**
 * Interface for all chunking strategies
 */
export interface ChunkingStrategy {
  chunk(text: string, config: ChunkingConfig, userContext: UserContext): Promise&lt;TextChunk[]&gt;;
  validateChunk(chunk: TextChunk): boolean;
  getName(): string;
}

/**
 * Result of chunking operation with metadata
 */
export interface ChunkingResult {
  chunks: TextChunk[];
  totalTokens: number;
  chunkCount: number;
  strategy: string;
  processingTimeMs: number;
  metadata?: {
    semanticValidationApplied?: boolean;
    averageSemanticScore?: number;
    boundaryAdjustments?: number;
  };
}

/**
 * Semantic similarity result for boundary validation
 */
export interface SemanticSimilarity {
  similarity: number;
  distance: number;
  threshold: number;
  shouldMerge: boolean;
}

/**
 * Interface for embedding service
 */
export interface EmbeddingService {
  generateEmbedding(text: string): Promise&lt;number[]&gt;;
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number;
  calculateCosineDistance(embedding1: number[], embedding2: number[]): number;
}
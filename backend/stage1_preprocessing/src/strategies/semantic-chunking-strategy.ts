import {
  ChunkingStrategy,
  TextChunk,
  ChunkingConfig,
  UserContext,
  SemanticSimilarity,
  EmbeddingService
} from '../interfaces/chunking-interfaces';
import { TextUtils } from '../utils/text-utils';
import { ChunkingConstants } from '../config/chunking-config';
import { MockEmbeddingService } from '../services/embedding-service';

/**
 * Semantic Chunking Strategy
 * Uses vector embeddings to determine optimal chunk boundaries based on semantic meaning
 * This is computationally intensive and typically used for premium users
 */
export class SemanticChunkingStrategy implements ChunkingStrategy {
  private embeddingService: EmbeddingService;

  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || new MockEmbeddingService();
  }

  getName(): string {
    return 'SemanticChunking';
  }

  async chunk(
    text: string,
    config: ChunkingConfig,
    userContext: UserContext
  ): Promise&lt;TextChunk[]&gt; {
    const normalizedText = TextUtils.normalizeText(text);
    
    if (!normalizedText || normalizedText.length === 0) {
      return [];
    }

    // If text is small, return as single chunk
    const totalTokens = TextUtils.countTokens(normalizedText);
    if (totalTokens <= config.maxTokens) {
      return [{
        id: TextUtils.generateChunkId(0, 0),
        content: normalizedText,
        startIndex: 0,
        endIndex: normalizedText.length,
        tokenCount: totalTokens,
        metadata: {
          boundaryType: 'semantic',
          semanticScore: 1.0
        }
      }];
    }

    try {
      // Extract sentences for semantic analysis
      const sentences = this.extractSentences(normalizedText);
      
      if (sentences.length <= 1) {
        // Fallback to single chunk if no sentences found
        return this.createFallbackChunk(normalizedText);
      }

      // Generate embeddings for sentences
      const embeddings = await this.generateSentenceEmbeddings(sentences);
      
      // Calculate semantic distances between adjacent sentences
      const semanticDistances = this.calculateSemanticDistances(embeddings);
      
      // Determine optimal chunk boundaries
      const boundaryIndices = this.findOptimalBoundaries(
        sentences,
        semanticDistances,
        config
      );

      // Create chunks based on boundaries
      const chunks = this.createSemanticChunks(
        sentences,
        boundaryIndices,
        semanticDistances,
        normalizedText
      );

      // Apply overlap
      const overlappedChunks = TextUtils.addOverlap(chunks, config.overlapPercentage);

      // Validate and filter chunks
      return overlappedChunks.filter(chunk => this.validateChunk(chunk));

    } catch (error) {
      console.warn('Semantic chunking failed, falling back to simple chunking:', error);
      return this.createFallbackChunk(normalizedText);
    }
  }

  private extractSentences(text: string): string[] {
    // Enhanced sentence extraction with better boundary detection
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z])/) // Split on sentence boundaries
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10); // Filter out very short fragments

    return sentences.length > 0 ? sentences : [text]; // Fallback to full text
  }

  private async generateSentenceEmbeddings(sentences: string[]): Promise&lt;number[][]&gt; {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid overwhelming the embedding service
    const batchSize = ChunkingConstants.BATCH_SIZE_FOR_EMBEDDINGS;
    
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      
      const batchEmbeddings = await Promise.all(
        batch.map(sentence => this.embeddingService.generateEmbedding(sentence))
      );
      
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  private calculateSemanticDistances(embeddings: number[][]): number[] {
    const distances: number[] = [];
    
    for (let i = 0; i < embeddings.length - 1; i++) {
      const distance = this.embeddingService.calculateCosineDistance(
        embeddings[i],
        embeddings[i + 1]
      );
      distances.push(distance);
    }

    return distances;
  }

  private findOptimalBoundaries(
    sentences: string[],
    distances: number[],
    config: ChunkingConfig
  ): number[] {
    const boundaries: number[] = [0]; // Always start with first sentence
    
    // Calculate threshold for significant semantic shifts
    const threshold = config.semanticThreshold || 
      TextUtils.calculatePercentile(distances, ChunkingConstants.SEMANTIC_DISTANCE_PERCENTILE);
    
    let currentChunkTokens = 0;
    let currentChunkStart = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentenceTokens = TextUtils.countTokens(sentences[i]);
      
      // Check if adding this sentence would exceed max tokens
      if (currentChunkTokens + sentenceTokens > config.maxTokens && i > currentChunkStart) {
        boundaries.push(i);
        currentChunkStart = i;
        currentChunkTokens = sentenceTokens;
      } else {
        currentChunkTokens += sentenceTokens;
        
        // Check for semantic boundary
        if (i > 0 && distances[i - 1] > threshold) {
          // Ensure we don't create chunks that are too small
          const chunkTokens = this.calculateChunkTokens(sentences.slice(currentChunkStart, i));
          
          if (chunkTokens >= config.minChunkSize) {
            boundaries.push(i);
            currentChunkStart = i;
            currentChunkTokens = sentenceTokens;
          }
        }
      }
    }

    // Add final boundary if not already present
    if (boundaries[boundaries.length - 1] !== sentences.length) {
      boundaries.push(sentences.length);
    }

    return boundaries;
  }

  private createSemanticChunks(
    sentences: string[],
    boundaries: number[],
    distances: number[],
    originalText: string
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i];
      const end = boundaries[i + 1];
      const chunkSentences = sentences.slice(start, end);
      const content = chunkSentences.join(' ');
      
      // Calculate semantic score (average similarity within chunk)
      let semanticScore = 1.0;
      if (end - start > 1) {
        const relevantDistances = distances.slice(start, end - 1);
        const avgDistance = relevantDistances.reduce((sum, d) => sum + d, 0) / relevantDistances.length;
        semanticScore = Math.max(0, 1 - avgDistance); // Convert distance to similarity
      }

      // Find start and end positions in original text
      const startIndex = this.findTextPosition(originalText, chunkSentences[0]);
      const endIndex = startIndex + content.length;

      chunks.push({
        id: TextUtils.generateChunkId(i, startIndex),
        content: content.trim(),
        startIndex,
        endIndex,
        tokenCount: TextUtils.countTokens(content),
        metadata: {
          boundaryType: 'semantic',
          semanticScore
        }
      });
    }

    return chunks;
  }

  private calculateChunkTokens(sentences: string[]): number {
    return sentences.reduce((total, sentence) => total + TextUtils.countTokens(sentence), 0);
  }

  private findTextPosition(text: string, sentence: string): number {
    const index = text.indexOf(sentence.trim());
    return Math.max(0, index);
  }

  private createFallbackChunk(text: string): TextChunk[] {
    // Fallback to simple splitting if semantic analysis fails
    const words = text.split(/\s+/);
    const chunks: TextChunk[] = [];
    const maxWordsPerChunk = 100; // Conservative estimate
    
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      const chunkWords = words.slice(i, i + maxWordsPerChunk);
      const content = chunkWords.join(' ');
      const startIndex = text.indexOf(chunkWords[0]);
      
      chunks.push({
        id: TextUtils.generateChunkId(chunks.length, startIndex),
        content,
        startIndex,
        endIndex: startIndex + content.length,
        tokenCount: TextUtils.countTokens(content),
        metadata: {
          boundaryType: 'word',
          semanticScore: 0.5 // Neutral score for fallback
        }
      });
    }
    
    return chunks;
  }

  validateChunk(chunk: TextChunk): boolean {
    return (
      chunk.content.trim().length > 0 &&
      chunk.tokenCount > 0 &&
      chunk.endIndex > chunk.startIndex &&
      chunk.id.length > 0 &&
      (chunk.metadata?.semanticScore || 0) >= 0
    );
  }

  /**
   * Analyze semantic quality of chunk boundaries
   */
  async analyzeChunkQuality(chunks: TextChunk[]): Promise&lt;{
    averageSemanticScore: number;
    boundaryQuality: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  }&gt; {
    const semanticScores = chunks
      .map(chunk => chunk.metadata?.semanticScore || 0)
      .filter(score => score > 0);

    const averageScore = semanticScores.reduce((sum, score) => sum + score, 0) / semanticScores.length;
    
    let boundaryQuality: 'excellent' | 'good' | 'fair' | 'poor';
    const recommendations: string[] = [];

    if (averageScore >= 0.8) {
      boundaryQuality = 'excellent';
    } else if (averageScore >= 0.6) {
      boundaryQuality = 'good';
    } else if (averageScore >= 0.4) {
      boundaryQuality = 'fair';
      recommendations.push('Consider adjusting semantic threshold for better boundaries');
    } else {
      boundaryQuality = 'poor';
      recommendations.push('Text may benefit from recursive chunking instead');
      recommendations.push('Consider preprocessing text for better sentence detection');
    }

    // Additional recommendations based on chunk characteristics
    const avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0) / chunks.length;
    if (avgChunkSize < 50) {
      recommendations.push('Chunks are quite small - consider increasing minimum chunk size');
    }
    if (avgChunkSize > 800) {
      recommendations.push('Chunks are large - consider decreasing maximum chunk size');
    }

    return {
      averageSemanticScore: averageScore,
      boundaryQuality,
      recommendations
    };
  }
}
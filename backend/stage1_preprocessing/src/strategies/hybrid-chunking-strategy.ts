import {
  ChunkingStrategy,
  TextChunk,
  ChunkingConfig,
  UserContext,
  EmbeddingService
} from '../interfaces/chunking-interfaces';
import { TextUtils } from '../utils/text-utils';
import { ChunkingConstants } from '../config/chunking-config';
import { RecursiveChunkingStrategy } from './recursive-chunking-strategy';
import { SemanticChunkingStrategy } from './semantic-chunking-strategy';
import { MockEmbeddingService } from '../services/embedding-service';

/**
 * Hybrid Chunking Strategy
 * Combines the speed of recursive chunking with the intelligence of semantic analysis
 * 
 * Process:
 * 1. Primary segmentation with recursive splitting (fast, structural)
 * 2. Semantic boundary validation for premium users (intelligent refinement)
 * 3. Merge chunks with poor semantic boundaries if within size limits
 */
export class HybridChunkingStrategy implements ChunkingStrategy {
  private recursiveStrategy: RecursiveChunkingStrategy;
  private semanticStrategy: SemanticChunkingStrategy;
  private embeddingService: EmbeddingService;

  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService || new MockEmbeddingService();
    this.recursiveStrategy = new RecursiveChunkingStrategy();
    this.semanticStrategy = new SemanticChunkingStrategy(this.embeddingService);
  }

  getName(): string {
    return 'HybridChunking';
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

    // Step 1: Primary segmentation with recursive splitting
    console.log(`[${this.getName()}] Starting recursive chunking...`);
    const recursiveChunks = await this.recursiveStrategy.chunk(
      normalizedText,
      config,
      userContext
    );

    // If not premium or personal-touch mode, return recursive chunks
    if (!userContext.isPremium || userContext.selectedMode !== 'personal-touch') {
      console.log(`[${this.getName()}] Non-premium user, returning recursive chunks`);
      return recursiveChunks;
    }

    // Step 2: Semantic validation for premium users
    console.log(`[${this.getName()}] Applying semantic validation...`);
    
    try {
      const refinedChunks = await this.applySemanticsValidation(
        recursiveChunks,
        config,
        normalizedText
      );

      console.log(`[${this.getName()}] Semantic validation complete. Chunks: ${recursiveChunks.length} → ${refinedChunks.length}`);
      return refinedChunks;

    } catch (error) {
      console.warn(`[${this.getName()}] Semantic validation failed, falling back to recursive chunks:`, error);
      return recursiveChunks;
    }
  }

  /**
   * Apply semantic validation to recursive chunks
   * Analyzes boundaries and merges chunks with poor semantic separation
   */
  private async applySemanticsValidation(
    chunks: TextChunk[],
    config: ChunkingConfig,
    originalText: string
  ): Promise&lt;TextChunk[]&gt; {
    if (chunks.length <= 1) {
      return chunks;
    }

    // Analyze semantic boundaries between adjacent chunks
    const boundaryAnalysis = await this.analyzeBoundaries(chunks, config);
    
    // Identify chunks that should be merged based on semantic analysis
    const mergeDecisions = this.identifyMergeCandidates(
      chunks,
      boundaryAnalysis,
      config
    );

    // Apply merging decisions
    const refinedChunks = this.applyMergeDecisions(chunks, mergeDecisions);

    // Re-apply overlap to refined chunks
    return TextUtils.addOverlap(refinedChunks, config.overlapPercentage);
  }

  /**
   * Analyze semantic boundaries between adjacent chunks
   */
  private async analyzeBoundaries(
    chunks: TextChunk[],
    config: ChunkingConfig
  ): Promise&lt;{
    distances: number[];
    threshold: number;
    avgDistance: number;
  }&gt; {
    const boundaries: Array&lt;{ chunk1LastSentence: string; chunk2FirstSentence: string }&gt; = [];
    
    // Extract boundary context for each adjacent pair
    for (let i = 0; i < chunks.length - 1; i++) {
      const boundaryContext = TextUtils.getBoundaryContext(chunks[i], chunks[i + 1]);
      boundaries.push(boundaryContext);
    }

    // Generate embeddings for boundary sentences
    const embeddings: Array&lt;{ embedding1: number[]; embedding2: number[] }&gt; = [];
    
    for (const boundary of boundaries) {
      const [embedding1, embedding2] = await Promise.all([
        this.embeddingService.generateEmbedding(boundary.chunk1LastSentence),
        this.embeddingService.generateEmbedding(boundary.chunk2FirstSentence)
      ]);
      
      embeddings.push({ embedding1, embedding2 });
    }

    // Calculate semantic distances
    const distances = embeddings.map(({ embedding1, embedding2 }) => 
      this.embeddingService.calculateCosineDistance(embedding1, embedding2)
    );

    // Calculate threshold for "poor" boundaries (95th percentile)
    const threshold = config.semanticThreshold || 
      TextUtils.calculatePercentile(distances, ChunkingConstants.SEMANTIC_DISTANCE_PERCENTILE);
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

    return { distances, threshold, avgDistance };
  }

  /**
   * Identify which chunks should be merged based on semantic analysis
   */
  private identifyMergeCandidates(
    chunks: TextChunk[],
    boundaryAnalysis: { distances: number[]; threshold: number; avgDistance: number },
    config: ChunkingConfig
  ): boolean[] {
    const mergeDecisions: boolean[] = new Array(chunks.length - 1).fill(false);
    
    for (let i = 0; i < boundaryAnalysis.distances.length; i++) {
      const distance = boundaryAnalysis.distances[i];
      const chunk1 = chunks[i];
      const chunk2 = chunks[i + 1];
      
      // Consider merging if:
      // 1. Semantic distance is unusually high (poor boundary)
      // 2. Combined chunk size doesn't exceed limits
      // 3. Neither chunk is too large on its own
      
      const isPoorboundary = distance > boundaryAnalysis.threshold;
      const combinedTokens = chunk1.tokenCount + chunk2.tokenCount;
      const wouldExceedLimit = combinedTokens > config.maxTokens;
      const bothChunksReasonableSize = chunk1.tokenCount < config.maxTokens * 0.8 && 
                                      chunk2.tokenCount < config.maxTokens * 0.8;

      if (isPoorboundary && !wouldExceedLimit && bothChunksReasonableSize) {
        mergeDecisions[i] = true;
        console.log(`[${this.getName()}] Marking chunks ${i} and ${i+1} for merge (distance: ${distance.toFixed(3)}, threshold: ${boundaryAnalysis.threshold.toFixed(3)})`);
      }
    }

    return mergeDecisions;
  }

  /**
   * Apply merge decisions to create refined chunks
   */
  private applyMergeDecisions(chunks: TextChunk[], mergeDecisions: boolean[]): TextChunk[] {
    const refinedChunks: TextChunk[] = [];
    let i = 0;

    while (i < chunks.length) {
      let currentChunk = chunks[i];
      
      // Check if this chunk should be merged with the next one
      while (i < mergeDecisions.length && mergeDecisions[i]) {
        const nextChunk = chunks[i + 1];
        currentChunk = this.mergeChunks(currentChunk, nextChunk);
        i++; // Skip the next chunk as it's been merged
        
        // Update the merge decision array to handle chain merging
        if (i < mergeDecisions.length) {
          // If we merged, we need to check if the new merged chunk should merge with the next
          // For simplicity, we'll be conservative and stop chain merging here
          break;
        }
      }
      
      refinedChunks.push(currentChunk);
      i++;
    }

    return refinedChunks;
  }

  /**
   * Merge two chunks with semantic boundary metadata
   */
  private mergeChunks(chunk1: TextChunk, chunk2: TextChunk): TextChunk {
    const mergedContent = chunk1.content + ' ' + chunk2.content;
    const mergedTokens = TextUtils.countTokens(mergedContent);
    
    // Calculate combined semantic score
    const score1 = chunk1.metadata?.semanticScore || 0.5;
    const score2 = chunk2.metadata?.semanticScore || 0.5;
    const combinedScore = (score1 * chunk1.tokenCount + score2 * chunk2.tokenCount) / 
                         (chunk1.tokenCount + chunk2.tokenCount);

    return {
      id: TextUtils.generateChunkId(0, chunk1.startIndex),
      content: mergedContent.trim(),
      startIndex: chunk1.startIndex,
      endIndex: chunk2.endIndex,
      tokenCount: mergedTokens,
      metadata: {
        boundaryType: 'semantic',
        semanticScore: combinedScore,
        overlapStart: chunk1.metadata?.overlapStart || 0,
        overlapEnd: chunk2.metadata?.overlapEnd || 0
      }
    };
  }

  validateChunk(chunk: TextChunk): boolean {
    return this.recursiveStrategy.validateChunk(chunk);
  }

  /**
   * Get detailed analysis of the hybrid chunking process
   */
  async analyzeHybridPerformance(
    originalChunks: TextChunk[],
    refinedChunks: TextChunk[],
    processingTimeMs: number
  ): Promise&lt;{
    chunkReduction: number;
    averageChunkSizeIncrease: number;
    semanticImprovementScore: number;
    processingOverhead: number;
    recommendations: string[];
  }&gt; {
    const chunkReduction = originalChunks.length - refinedChunks.length;
    const chunkReductionPercentage = (chunkReduction / originalChunks.length) * 100;
    
    const originalAvgSize = originalChunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0) / originalChunks.length;
    const refinedAvgSize = refinedChunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0) / refinedChunks.length;
    const averageChunkSizeIncrease = ((refinedAvgSize - originalAvgSize) / originalAvgSize) * 100;
    
    // Calculate semantic improvement (higher semantic scores are better)
    const originalSemanticScore = originalChunks.reduce((sum, chunk) => 
      sum + (chunk.metadata?.semanticScore || 0.5), 0) / originalChunks.length;
    const refinedSemanticScore = refinedChunks.reduce((sum, chunk) => 
      sum + (chunk.metadata?.semanticScore || 0.5), 0) / refinedChunks.length;
    const semanticImprovementScore = ((refinedSemanticScore - originalSemanticScore) / originalSemanticScore) * 100;
    
    // Processing overhead (in milliseconds)
    const processingOverhead = processingTimeMs;
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (chunkReductionPercentage < 5) {
      recommendations.push('Low chunk reduction achieved - consider adjusting semantic threshold');
    } else if (chunkReductionPercentage > 30) {
      recommendations.push('High chunk reduction - verify chunks maintain semantic coherence');
    }
    
    if (averageChunkSizeIncrease > 50) {
      recommendations.push('Significant chunk size increase - monitor for potential context window issues');
    }
    
    if (semanticImprovementScore < 5) {
      recommendations.push('Minimal semantic improvement - recursive chunking may be sufficient');
    }
    
    if (processingOverhead > 5000) {
      recommendations.push('High processing overhead - consider caching embeddings for repeated texts');
    }
    
    return {
      chunkReduction: chunkReductionPercentage,
      averageChunkSizeIncrease,
      semanticImprovementScore,
      processingOverhead,
      recommendations
    };
  }
}
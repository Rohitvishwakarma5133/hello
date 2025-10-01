import { 
  ChunkingStrategy, 
  ChunkingResult, 
  ChunkingConfig, 
  UserContext, 
  TextChunk 
} from '../interfaces/chunking-interfaces';
import { ChunkingConfigFactory } from '../config/chunking-config';
import { RecursiveChunkingStrategy } from '../strategies/recursive-chunking-strategy';
import { SemanticChunkingStrategy } from '../strategies/semantic-chunking-strategy';
import { HybridChunkingStrategy } from '../strategies/hybrid-chunking-strategy';

/**
 * ChunkingService orchestrates different chunking strategies based on
 * user selection and premium status.
 */
export class ChunkingService {
  private recursiveStrategy: ChunkingStrategy;
  private semanticStrategy: ChunkingStrategy;
  private hybridStrategy: ChunkingStrategy;

  constructor() {
    this.recursiveStrategy = new RecursiveChunkingStrategy();
    this.semanticStrategy = new SemanticChunkingStrategy();
    this.hybridStrategy = new HybridChunkingStrategy();
  }

  /**
   * Main entry point to chunk text based on user context and settings
   */
  async process(
    text: string,
    userContext: UserContext,
    config?: Partial<ChunkingConfig>
  ): Promise<ChunkingResult> {
    const startTime = Date.now();

    // Determine optimal base config
    const baseConfig = ChunkingConfigFactory.getOptimalConfig(
      text.length,
      userContext.isPremium,
      userContext.selectedMode
    );

    // Merge with overrides
    const finalConfig: ChunkingConfig = {
      ...baseConfig,
      ...config,
      separators: config?.separators || baseConfig.separators
    };

    // Select strategy
    let strategy: ChunkingStrategy;
    if (userContext.isPremium && userContext.selectedMode === 'personal-touch') {
      strategy = this.hybridStrategy; // Hybrid for premium personal touch
    } else {
      strategy = this.recursiveStrategy; // Default
    }

    // Execute chunking
    const chunks: TextChunk[] = await strategy.chunk(text, finalConfig, userContext);

    const endTime = Date.now();

    return {
      chunks,
      totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
      chunkCount: chunks.length,
      strategy: strategy.getName(),
      processingTimeMs: endTime - startTime
    };
  }
}

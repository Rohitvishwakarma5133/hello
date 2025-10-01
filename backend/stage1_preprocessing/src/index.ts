// Core interfaces
export * from './interfaces/chunking-interfaces';

// Utilities
export { TextUtils } from './utils/text-utils';

// Configuration
export { ChunkingConfigFactory, ChunkingConstants } from './config/chunking-config';

// Services
export { ChunkingService } from './services/chunking-service';
export { MockEmbeddingService, ProductionEmbeddingService } from './services/embedding-service';

// Strategies
export { RecursiveChunkingStrategy } from './strategies/recursive-chunking-strategy';
export { SemanticChunkingStrategy } from './strategies/semantic-chunking-strategy';
export { HybridChunkingStrategy } from './strategies/hybrid-chunking-strategy';

// Main facade for easy usage
import { ChunkingService } from './services/chunking-service';
import { UserContext } from './interfaces/chunking-interfaces';

/**
 * Simple facade for chunking text
 */
export class TextChunker {
  private service: ChunkingService;

  constructor() {
    this.service = new ChunkingService();
  }

  /**
   * Chunk text with simple parameters
   */
  async chunk(
    text: string, 
    options: {
      userId: string;
      isPremium?: boolean;
      mode?: 'default' | 'personal-touch';
      maxTokens?: number;
      overlapPercentage?: number;
    }
  ) {
    const userContext: UserContext = {
      userId: options.userId,
      isPremium: options.isPremium || false,
      selectedMode: options.mode || 'default'
    };

    const config = {
      maxTokens: options.maxTokens,
      overlapPercentage: options.overlapPercentage
    };

    return this.service.process(text, userContext, config);
  }
}

// Default export
export default TextChunker;
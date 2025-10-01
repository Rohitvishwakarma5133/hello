import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  TextChunker,
  ChunkingService,
  RecursiveChunkingStrategy,
  SemanticChunkingStrategy,
  HybridChunkingStrategy,
  TextUtils,
  ChunkingConfigFactory,
  MockEmbeddingService
} from '../src/index';
import { UserContext, ChunkingConfig } from '../src/interfaces/chunking-interfaces';

// Test data
const sampleText = `
Artificial Intelligence (AI) has emerged as one of the most transformative technologies of the 21st century. 
From machine learning algorithms that power recommendation systems to natural language processing models that 
enable human-computer interaction, AI is reshaping industries across the globe.

Machine learning, a subset of AI, focuses on creating algorithms that can learn and improve from data without 
explicit programming. Deep learning, which uses neural networks with multiple layers, has achieved remarkable 
breakthroughs in image recognition, speech synthesis, and language translation.

Natural language processing (NLP) is another crucial area of AI that deals with the interaction between 
computers and human language. Modern NLP models like transformers have revolutionized how machines understand 
and generate human language, leading to applications like chatbots, translation services, and content generation.

The future of AI holds immense promise, with potential applications in healthcare, autonomous vehicles, 
climate change mitigation, and scientific research. However, it also raises important ethical questions 
about privacy, job displacement, and the need for responsible AI development.
`;

const shortText = "This is a short text that should fit in one chunk.";
const longText = sampleText.repeat(5); // Very long text to test multiple chunks

describe('TextUtils', () => {
  test('should count tokens accurately', () => {
    expect(TextUtils.countTokens("Hello world")).toBeGreaterThan(0);
    expect(TextUtils.countTokens("")).toBe(0);
    expect(TextUtils.countTokens("A very long sentence with many words")).toBeGreaterThan(5);
  });

  test('should generate unique chunk IDs', () => {
    const id1 = TextUtils.generateChunkId(0, 0);
    const id2 = TextUtils.generateChunkId(0, 0);
    expect(id1).not.toBe(id2);
  });

  test('should normalize text correctly', () => {
    const input = "  Hello\r\n\r\nWorld  \n  ";
    const expected = "Hello\n\nWorld";
    expect(TextUtils.normalizeText(input)).toBe(expected);
  });

  test('should split by hierarchy correctly', () => {
    const text = "First paragraph.\n\nSecond paragraph. Third sentence.";
    const separators = ['\n\n', '. '];
    const result = TextUtils.splitByHierarchy(text, separators);
    expect(result.length).toBeGreaterThan(1);
  });

  test('should add overlap to chunks', () => {
    const chunks = [
      {
        id: '1',
        content: 'First chunk content here.',
        startIndex: 0,
        endIndex: 25,
        tokenCount: 5,
        metadata: {}
      },
      {
        id: '2',
        content: 'Second chunk content here.',
        startIndex: 25,
        endIndex: 50,
        tokenCount: 5,
        metadata: {}
      }
    ];

    const overlapped = TextUtils.addOverlap(chunks, 20);
    expect(overlapped[1].content).toContain('First');
    expect(overlapped[1].metadata?.overlapStart).toBeGreaterThan(0);
  });
});

describe('ChunkingConfigFactory', () => {
  test('should return default config', () => {
    const config = ChunkingConfigFactory.getDefaultConfig();
    expect(config.maxTokens).toBeGreaterThan(0);
    expect(config.separators).toContain('\n\n');
    expect(config.overlapPercentage).toBeGreaterThan(0);
  });

  test('should return personal touch config for premium users', () => {
    const config = ChunkingConfigFactory.getOptimalConfig(1000, true, 'personal-touch');
    expect(config.semanticThreshold).toBeDefined();
    expect(config.overlapPercentage).toBeGreaterThan(15); // More overlap for premium
  });

  test('should return appropriate config based on text length', () => {
    const shortConfig = ChunkingConfigFactory.getOptimalConfig(100, false, 'default');
    const longConfig = ChunkingConfigFactory.getOptimalConfig(10000, false, 'default');
    
    expect(shortConfig.maxTokens).toBeLessThan(longConfig.maxTokens);
  });
});

describe('MockEmbeddingService', () => {
  let embeddingService: MockEmbeddingService;

  beforeEach(() => {
    embeddingService = new MockEmbeddingService();
  });

  test('should generate embeddings', async () => {
    const embedding = await embeddingService.generateEmbedding("Test sentence");
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
    expect(typeof embedding[0]).toBe('number');
  });

  test('should calculate cosine similarity', async () => {
    const embedding1 = await embeddingService.generateEmbedding("Hello world");
    const embedding2 = await embeddingService.generateEmbedding("Hello universe");
    const embedding3 = await embeddingService.generateEmbedding("Completely different topic about cars");

    const similarity12 = embeddingService.calculateCosineSimilarity(embedding1, embedding2);
    const similarity13 = embeddingService.calculateCosineSimilarity(embedding1, embedding3);

    expect(similarity12).toBeGreaterThan(similarity13); // Similar texts should be more similar
    expect(similarity12).toBeGreaterThanOrEqual(0);
    expect(similarity12).toBeLessThanOrEqual(1);
  });

  test('should calculate cosine distance', async () => {
    const embedding1 = await embeddingService.generateEmbedding("Test");
    const embedding2 = await embeddingService.generateEmbedding("Test");

    const distance = embeddingService.calculateCosineDistance(embedding1, embedding2);
    expect(distance).toBeGreaterThanOrEqual(0);
    expect(distance).toBeLessThanOrEqual(1);
  });

  test('should cache embeddings', async () => {
    const text = "Cache test";
    const embedding1 = await embeddingService.generateEmbedding(text);
    const embedding2 = await embeddingService.generateEmbedding(text);
    
    // Should return the same cached result
    expect(embedding1).toEqual(embedding2);
  });
});

describe('RecursiveChunkingStrategy', () => {
  let strategy: RecursiveChunkingStrategy;
  let config: ChunkingConfig;
  let userContext: UserContext;

  beforeEach(() => {
    strategy = new RecursiveChunkingStrategy();
    config = ChunkingConfigFactory.getDefaultConfig();
    userContext = { userId: 'test', isPremium: false, selectedMode: 'default' };
  });

  test('should chunk text recursively', async () => {
    const chunks = await strategy.chunk(sampleText, config, userContext);
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].content).toBeTruthy();
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
    expect(chunks[0].id).toBeTruthy();
  });

  test('should return single chunk for short text', async () => {
    const chunks = await strategy.chunk(shortText, config, userContext);
    expect(chunks.length).toBe(1);
  });

  test('should respect max token limits', async () => {
    const chunks = await strategy.chunk(longText, config, userContext);
    
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeLessThanOrEqual(config.maxTokens);
    }
  });

  test('should validate chunks', () => {
    const validChunk = {
      id: 'test',
      content: 'Valid content',
      startIndex: 0,
      endIndex: 13,
      tokenCount: 2,
      metadata: {}
    };

    const invalidChunk = {
      id: '',
      content: '',
      startIndex: 0,
      endIndex: 0,
      tokenCount: 0,
      metadata: {}
    };

    expect(strategy.validateChunk(validChunk)).toBe(true);
    expect(strategy.validateChunk(invalidChunk)).toBe(false);
  });

  test('should handle empty text', async () => {
    const chunks = await strategy.chunk('', config, userContext);
    expect(chunks.length).toBe(0);
  });
});

describe('SemanticChunkingStrategy', () => {
  let strategy: SemanticChunkingStrategy;
  let config: ChunkingConfig;
  let userContext: UserContext;

  beforeEach(() => {
    strategy = new SemanticChunkingStrategy();
    config = ChunkingConfigFactory.getPersonalTouchConfig();
    userContext = { userId: 'test', isPremium: true, selectedMode: 'personal-touch' };
  });

  test('should chunk text semantically', async () => {
    const chunks = await strategy.chunk(sampleText, config, userContext);
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata?.boundaryType).toBe('semantic');
    expect(chunks[0].metadata?.semanticScore).toBeDefined();
  });

  test('should handle single sentence gracefully', async () => {
    const singleSentence = "This is just one sentence without much content.";
    const chunks = await strategy.chunk(singleSentence, config, userContext);
    
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  test('should analyze chunk quality', async () => {
    const chunks = await strategy.chunk(sampleText, config, userContext);
    const analysis = await strategy.analyzeChunkQuality(chunks);
    
    expect(analysis.averageSemanticScore).toBeGreaterThanOrEqual(0);
    expect(analysis.boundaryQuality).toMatch(/excellent|good|fair|poor/);
    expect(Array.isArray(analysis.recommendations)).toBe(true);
  });
});

describe('HybridChunkingStrategy', () => {
  let strategy: HybridChunkingStrategy;
  let config: ChunkingConfig;
  let premiumUserContext: UserContext;
  let regularUserContext: UserContext;

  beforeEach(() => {
    strategy = new HybridChunkingStrategy();
    config = ChunkingConfigFactory.getPersonalTouchConfig();
    premiumUserContext = { userId: 'premium', isPremium: true, selectedMode: 'personal-touch' };
    regularUserContext = { userId: 'regular', isPremium: false, selectedMode: 'default' };
  });

  test('should use recursive chunking for non-premium users', async () => {
    const chunks = await strategy.chunk(sampleText, config, regularUserContext);
    
    expect(chunks.length).toBeGreaterThan(0);
    // Should not apply semantic validation for non-premium users
    expect(chunks[0].content).toBeTruthy();
  });

  test('should apply semantic validation for premium users', async () => {
    const chunks = await strategy.chunk(sampleText, config, premiumUserContext);
    
    expect(chunks.length).toBeGreaterThan(0);
    // Check if semantic processing was applied
    const hasSemanticMetadata = chunks.some(chunk => 
      chunk.metadata?.semanticScore !== undefined
    );
    expect(hasSemanticMetadata).toBe(true);
  });

  test('should handle fallback gracefully', async () => {
    // Test with malformed input that might cause semantic processing to fail
    const problematicText = "A".repeat(1000); // Very repetitive text
    const chunks = await strategy.chunk(problematicText, config, premiumUserContext);
    
    expect(chunks.length).toBeGreaterThan(0);
  });
});

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(() => {
    service = new ChunkingService();
  });

  test('should process text with default user', async () => {
    const userContext: UserContext = { 
      userId: 'test', 
      isPremium: false, 
      selectedMode: 'default' 
    };

    const result = await service.process(sampleText, userContext);
    
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.chunkCount).toBe(result.chunks.length);
    expect(result.strategy).toBeTruthy();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  test('should process text with premium user', async () => {
    const userContext: UserContext = { 
      userId: 'premium', 
      isPremium: true, 
      selectedMode: 'personal-touch' 
    };

    const result = await service.process(sampleText, userContext);
    
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.strategy).toBe('HybridChunking');
  });

  test('should respect custom config overrides', async () => {
    const userContext: UserContext = { 
      userId: 'test', 
      isPremium: false, 
      selectedMode: 'default' 
    };

    const customConfig = {
      maxTokens: 100,
      overlapPercentage: 25
    };

    const result = await service.process(sampleText, userContext, customConfig);
    
    // Should have more chunks due to smaller max tokens
    expect(result.chunks.length).toBeGreaterThan(1);
    
    // Check if overlap was applied
    const hasOverlap = result.chunks.some(chunk => 
      chunk.metadata?.overlapStart && chunk.metadata.overlapStart > 0
    );
    expect(hasOverlap).toBe(true);
  });
});

describe('TextChunker (Facade)', () => {
  let chunker: TextChunker;

  beforeEach(() => {
    chunker = new TextChunker();
  });

  test('should chunk with simple options', async () => {
    const result = await chunker.chunk(sampleText, {
      userId: 'test-user',
      isPremium: false,
      mode: 'default',
      maxTokens: 300
    });

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.strategy).toBeTruthy();
  });

  test('should use default values for optional parameters', async () => {
    const result = await chunker.chunk(shortText, {
      userId: 'test-user'
    });

    expect(result.chunks.length).toBe(1);
  });

  test('should work with premium options', async () => {
    const result = await chunker.chunk(sampleText, {
      userId: 'premium-user',
      isPremium: true,
      mode: 'personal-touch',
      overlapPercentage: 30
    });

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.strategy).toBe('HybridChunking');
  });
});

// Performance and edge case tests
describe('Edge Cases and Performance', () => {
  test('should handle very long text', async () => {
    const veryLongText = sampleText.repeat(20);
    const chunker = new TextChunker();
    
    const result = await chunker.chunk(veryLongText, {
      userId: 'test',
      maxTokens: 500
    });

    expect(result.chunks.length).toBeGreaterThan(10);
    expect(result.processingTimeMs).toBeLessThan(10000); // Should complete in reasonable time
  });

  test('should handle text with no clear boundaries', async () => {
    const noBoundariesText = "word ".repeat(1000).trim();
    const chunker = new TextChunker();
    
    const result = await chunker.chunk(noBoundariesText, {
      userId: 'test',
      maxTokens: 100
    });

    expect(result.chunks.length).toBeGreaterThan(1);
  });

  test('should handle text with special characters', async () => {
    const specialText = "Hello! How are you? I'm fine. Let's go to café & restaurant.";
    const chunker = new TextChunker();
    
    const result = await chunker.chunk(specialText, {
      userId: 'test'
    });

    expect(result.chunks.length).toBeGreaterThanOrEqual(1);
    expect(result.chunks[0].content).toContain('Hello');
  });

  test('should handle multilingual content gracefully', async () => {
    const multilingualText = "Hello world. Bonjour le monde. Hola mundo. こんにちは世界。";
    const chunker = new TextChunker();
    
    const result = await chunker.chunk(multilingualText, {
      userId: 'test',
      maxTokens: 50
    });

    expect(result.chunks.length).toBeGreaterThanOrEqual(1);
  });
});
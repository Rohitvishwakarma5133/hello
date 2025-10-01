import { TextChunker, ChunkingService } from './src/index';

const sampleText = `
Artificial Intelligence (AI) has emerged as one of the most transformative technologies of the 21st century. From machine learning algorithms that power recommendation systems to natural language processing models that enable human-computer interaction, AI is reshaping industries across the globe.

Machine learning, a subset of AI, focuses on creating algorithms that can learn and improve from data without explicit programming. Deep learning, which uses neural networks with multiple layers, has achieved remarkable breakthroughs in image recognition, speech synthesis, and language translation.

Natural language processing (NLP) is another crucial area of AI that deals with the interaction between computers and human language. Modern NLP models like transformers have revolutionized how machines understand and generate human language, leading to applications like chatbots, translation services, and content generation.

The future of AI holds immense promise, with potential applications in healthcare, autonomous vehicles, climate change mitigation, and scientific research. However, it also raises important ethical questions about privacy, job displacement, and the need for responsible AI development.

As we continue to advance AI technologies, it becomes increasingly important to ensure that these systems are developed and deployed responsibly. This includes addressing concerns about bias, fairness, transparency, and accountability. The development of explainable AI systems that can provide clear reasoning for their decisions is crucial for building trust and ensuring that AI benefits society as a whole.
`;

async function demonstrateChunking() {
  console.log('🔧 AI Humanizer - Semantic Text Chunking Demo\n');
  console.log('=' .repeat(60));
  
  // Create chunker instance
  const chunker = new TextChunker();
  
  console.log('\n📄 Sample Text:');
  console.log('-'.repeat(40));
  console.log(sampleText.substring(0, 200) + '...\n');
  
  // Demo 1: Default chunking for regular user
  console.log('🔹 Demo 1: Default Chunking (Regular User)');
  console.log('-'.repeat(40));
  
  try {
    const defaultResult = await chunker.chunk(sampleText, {
      userId: 'user123',
      isPremium: false,
      mode: 'default',
      maxTokens: 300
    });
    
    console.log(`Strategy Used: ${defaultResult.strategy}`);
    console.log(`Chunks Created: ${defaultResult.chunkCount}`);
    console.log(`Total Tokens: ${defaultResult.totalTokens}`);
    console.log(`Processing Time: ${defaultResult.processingTimeMs}ms`);
    
    console.log('\nChunk Preview:');
    defaultResult.chunks.forEach((chunk, index) => {
      console.log(`  Chunk ${index + 1}: "${chunk.content.substring(0, 80)}..." (${chunk.tokenCount} tokens)`);
    });
    
  } catch (error) {
    console.error('Error in default chunking:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Demo 2: Premium chunking with personal touch
  console.log('\n🔹 Demo 2: Hybrid Chunking (Premium User - Personal Touch)');
  console.log('-'.repeat(40));
  
  try {
    const premiumResult = await chunker.chunk(sampleText, {
      userId: 'premium456',
      isPremium: true,
      mode: 'personal-touch',
      maxTokens: 400,
      overlapPercentage: 20
    });
    
    console.log(`Strategy Used: ${premiumResult.strategy}`);
    console.log(`Chunks Created: ${premiumResult.chunkCount}`);
    console.log(`Total Tokens: ${premiumResult.totalTokens}`);
    console.log(`Processing Time: ${premiumResult.processingTimeMs}ms`);
    
    console.log('\nChunk Preview:');
    premiumResult.chunks.forEach((chunk, index) => {
      const semanticScore = chunk.metadata?.semanticScore?.toFixed(2) || 'N/A';
      console.log(`  Chunk ${index + 1}: "${chunk.content.substring(0, 80)}..." (${chunk.tokenCount} tokens, semantic: ${semanticScore})`);
    });
    
  } catch (error) {
    console.error('Error in premium chunking:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Demo 3: Performance comparison
  console.log('\n🔹 Demo 3: Performance Comparison');
  console.log('-'.repeat(40));
  
  const longText = sampleText.repeat(5);
  console.log(`Testing with longer text (${longText.length} characters)...\n`);
  
  try {
    // Test default strategy
    const defaultStart = Date.now();
    const defaultLongResult = await chunker.chunk(longText, {
      userId: 'test1',
      isPremium: false,
      maxTokens: 500
    });
    const defaultTime = Date.now() - defaultStart;
    
    // Test premium strategy
    const premiumStart = Date.now();
    const premiumLongResult = await chunker.chunk(longText, {
      userId: 'test2',
      isPremium: true,
      mode: 'personal-touch',
      maxTokens: 500
    });
    const premiumTime = Date.now() - premiumStart;
    
    console.log('Performance Results:');
    console.log(`  Default Strategy: ${defaultLongResult.chunkCount} chunks in ${defaultTime}ms`);
    console.log(`  Premium Strategy: ${premiumLongResult.chunkCount} chunks in ${premiumTime}ms`);
    console.log(`  Overhead: ${premiumTime - defaultTime}ms (${((premiumTime / defaultTime - 1) * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error in performance comparison:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo completed successfully!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('  • Recursive character splitting for default users');
  console.log('  • Hybrid semantic validation for premium users');
  console.log('  • Configurable chunk sizes and overlap');
  console.log('  • Performance optimization and fallback handling');
  console.log('  • User tier-based feature gating');
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateChunking()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateChunking };
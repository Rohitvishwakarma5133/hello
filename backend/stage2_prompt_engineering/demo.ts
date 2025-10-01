import { TextHumanizer, HumanizationPromptFactory, AdvancedReasoningManager } from './src/index';
import { TextChunk, UserContext, PromptConfiguration } from './src/interfaces/prompt-interfaces';

const sampleTexts = {
  academic: `
Artificial intelligence (AI) has emerged as a transformative technology in the 21st century. 
The development of machine learning algorithms has enabled computers to learn from data without explicit programming. 
Deep learning, utilizing neural networks with multiple layers, has achieved remarkable breakthroughs in various domains. 
These technologies have applications in image recognition, natural language processing, and decision-making systems. 
Furthermore, the integration of AI in different industries has led to significant improvements in efficiency and productivity.
  `,
  
  business: `
Our company is committed to leveraging cutting-edge technology to deliver innovative solutions to our clients. 
We utilize advanced methodologies to optimize operational efficiency and maximize return on investment. 
Furthermore, our strategic approach enables us to identify key opportunities in the market. 
It is important to note that our comprehensive suite of services facilitates sustainable growth for businesses. 
Therefore, we are able to provide value-added solutions that exceed customer expectations.
  `,
  
  creative: `
The old lighthouse stood majestically on the rocky cliff, its beacon piercing through the thick fog. 
Waves crashed against the jagged rocks below with tremendous force. 
The lighthouse keeper watched from his window as ships navigated the treacherous waters. 
This scene had been repeated countless times over the decades. 
The lighthouse served as a guardian angel for sailors venturing into dangerous territory.
  `,
  
  technical: `
The system architecture implements a microservices approach using containerized deployment strategies. 
Each service component utilizes RESTful APIs to facilitate communication between different modules. 
The database layer employs a distributed architecture to ensure scalability and high availability. 
Furthermore, the implementation includes comprehensive monitoring and logging mechanisms. 
This approach enables the system to handle high-volume traffic while maintaining optimal performance.
  `
};

/**
 * Demo function to showcase the dynamic prompt engineering system
 */
async function demonstratePromptEngineering() {
  console.log('🔧 AI Humanizer - Stage 2.1: Dynamic and Layered Prompt Engineering Demo\n');
  console.log('=' .repeat(80));
  
  // Initialize the humanizer
  const humanizer = new TextHumanizer('development');
  
  // Check service health
  console.log('\n🏥 Health Check');
  console.log('-'.repeat(40));
  const health = await humanizer.getHealthStatus();
  console.log(`Service Status: ${health.status.toUpperCase()}`);
  console.log(`Prompt Generator: ${health.services.promptGenerator ? '✅' : '❌'}`);
  console.log(`LLM Service: ${health.services.llmService ? '✅' : '❌'}`);
  console.log(`Default Provider: ${health.services.defaultProvider ? '✅' : '❌'}`);
  
  console.log('\n' + '='.repeat(80));
  
  // Demo 1: Default vs Premium User Comparison
  await demonstrateUserTierComparison(humanizer);
  
  // Demo 2: Content Type Adaptation
  await demonstrateContentTypeAdaptation(humanizer);
  
  // Demo 3: Humanization Level Variations
  await demonstrateHumanizationLevels(humanizer);
  
  // Demo 4: Advanced Reasoning Patterns
  await demonstrateAdvancedReasoning();
  
  // Demo 5: Prompt Template Analysis
  demonstratePromptTemplates();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Demo completed successfully!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('  • Dynamic prompt selection based on user tier and content type');
  console.log('  • Layered prompt architecture (System/Context/Constraints/Reasoning/Critique)');
  console.log('  • Advanced reasoning patterns (Chain-of-Thought, Self-Consistency, Self-Critique)');
  console.log('  • Content-aware humanization strategies');
  console.log('  • Quality metrics and performance analysis');
  console.log('  • Premium vs Standard user experience differentiation');
}

async function demonstrateUserTierComparison(humanizer: TextHumanizer) {
  console.log('\n🔹 Demo 1: User Tier Comparison (Default vs Premium)');
  console.log('-'.repeat(60));
  
  const testText = sampleTexts.business;
  const chunks: TextChunk[] = [{
    id: 'chunk_1',
    content: testText.trim(),
    startIndex: 0,
    endIndex: testText.length,
    tokenCount: Math.ceil(testText.length / 4),
    metadata: { boundaryType: 'paragraph' }
  }];
  
  console.log('📄 Sample Text (Business):');
  console.log(`"${testText.substring(0, 100)}..."`);
  
  // Default user processing
  console.log('\n🆓 Default User Processing:');
  try {
    const defaultResult = await humanizer.humanize(chunks, {
      userId: 'user_default',
      isPremium: false,
      mode: 'default',
      textType: 'business',
      humanizationLevel: 'moderate'
    });
    
    console.log(`Strategy: ${defaultResult.metadata.promptTemplate}`);
    console.log(`Processing Time: ${defaultResult.metadata.totalProcessingTime}ms`);
    console.log(`Quality Score: ${(defaultResult.quality.qualityScore || 0).toFixed(2)}`);
    console.log('Humanized Preview:');
    console.log(`"${defaultResult.processedChunks[0].humanizedContent.substring(0, 150)}..."`);
  } catch (error) {
    console.error('Error in default processing:', error);
  }
  
  // Premium user processing
  console.log('\n💎 Premium User Processing (Personal Touch):');
  try {
    const premiumResult = await humanizer.humanize(chunks, {
      userId: 'user_premium',
      isPremium: true,
      mode: 'personal-touch',
      textType: 'business',
      humanizationLevel: 'aggressive',
      enableAdvancedReasoning: true,
      enableSelfCritique: true
    });
    
    console.log(`Strategy: ${premiumResult.metadata.promptTemplate}`);
    console.log(`Processing Time: ${premiumResult.metadata.totalProcessingTime}ms`);
    console.log(`Quality Score: ${(premiumResult.quality.qualityScore || 0).toFixed(2)}`);
    console.log(`Estimated Perplexity: ${(premiumResult.quality.estimatedPerplexity || 0).toFixed(2)}`);
    console.log(`Estimated Burstiness: ${(premiumResult.quality.estimatedBurstiness || 0).toFixed(2)}`);
    console.log('Humanized Preview:');
    console.log(`"${premiumResult.processedChunks[0].humanizedContent.substring(0, 150)}..."`);
  } catch (error) {
    console.error('Error in premium processing:', error);
  }
}

async function demonstrateContentTypeAdaptation(humanizer: TextHumanizer) {
  console.log('\n🔹 Demo 2: Content Type Adaptation');
  console.log('-'.repeat(60));
  
  const contentTypes: Array<{
    type: 'academic' | 'business' | 'creative' | 'technical';
    text: string;
  }> = [
    { type: 'academic', text: sampleTexts.academic },
    { type: 'business', text: sampleTexts.business },
    { type: 'creative', text: sampleTexts.creative },
    { type: 'technical', text: sampleTexts.technical }
  ];
  
  for (const { type, text } of contentTypes) {
    console.log(`\n📚 ${type.toUpperCase()} Content:`);
    
    const chunks: TextChunk[] = [{
      id: `chunk_${type}`,
      content: text.trim(),
      startIndex: 0,
      endIndex: text.length,
      tokenCount: Math.ceil(text.length / 4)
    }];
    
    try {
      const result = await humanizer.humanize(chunks, {
        userId: 'demo_user',
        isPremium: true,
        mode: 'personal-touch',
        textType: type,
        humanizationLevel: 'moderate'
      });
      
      const quality = result.processedChunks[0].processingMetadata.qualityIndicators;
      console.log(`Sentence Variety: ${quality.sentenceVariety.toFixed(2)}`);
      console.log(`Vocabulary Richness: ${quality.vocabularyRichness.toFixed(2)}`);
      console.log(`Naturalness: ${quality.naturalness.toFixed(2)}`);
      console.log(`Preview: "${result.processedChunks[0].humanizedContent.substring(0, 100)}..."`);
      
    } catch (error) {
      console.error(`Error processing ${type} content:`, error);
    }
  }
}

async function demonstrateHumanizationLevels(humanizer: TextHumanizer) {
  console.log('\n🔹 Demo 3: Humanization Level Variations');
  console.log('-'.repeat(60));
  
  const testText = sampleTexts.academic;
  const chunks: TextChunk[] = [{
    id: 'level_test',
    content: testText.trim(),
    startIndex: 0,
    endIndex: testText.length,
    tokenCount: Math.ceil(testText.length / 4)
  }];
  
  const levels: Array<'light' | 'moderate' | 'aggressive'> = ['light', 'moderate', 'aggressive'];
  
  for (const level of levels) {
    console.log(`\n🎚️ ${level.toUpperCase()} Humanization:`);
    
    try {
      const result = await humanizer.humanize(chunks, {
        userId: 'level_demo_user',
        isPremium: true,
        mode: 'personal-touch',
        textType: 'academic',
        humanizationLevel: level
      });
      
      const processing = result.metadata.totalProcessingTime;
      const quality = result.quality.qualityScore || 0;
      
      console.log(`Processing Time: ${processing}ms`);
      console.log(`Quality Score: ${quality.toFixed(2)}`);
      console.log(`Token Usage: ${result.metadata.tokenUsage.totalTokens}`);
      console.log(`Preview: "${result.processedChunks[0].humanizedContent.substring(0, 120)}..."`);
      
    } catch (error) {
      console.error(`Error with ${level} level:`, error);
    }
  }
}

async function demonstrateAdvancedReasoning() {
  console.log('\n🔹 Demo 4: Advanced Reasoning Patterns');
  console.log('-'.repeat(60));
  
  // Show different reasoning patterns
  console.log('\n🧠 Chain-of-Thought Pattern:');
  const cotTemplate = HumanizationPromptFactory.createPremiumTemplate();
  const basePrompt = {
    id: 'demo_prompt',
    templateId: cotTemplate.id,
    fullPrompt: 'Demo prompt for Chain-of-Thought',
    layers: {
      system: 'You are an expert editor.',
      context: 'Rewrite this text to be more human-like.',
      constraints: 'Follow humanization requirements.'
    },
    variables: {},
    metadata: {
      generatedAt: new Date(),
      configuration: {} as any,
      estimatedTokens: 100
    }
  };
  
  const cotPrompt = AdvancedReasoningManager.applyChainOfThought(basePrompt);
  console.log('Enhanced with reasoning layer:');
  console.log(cotPrompt.layers.reasoning?.substring(0, 200) + '...');
  
  console.log('\n🔄 Self-Consistency Pattern:');
  const scPrompt = AdvancedReasoningManager.applySelfConsistency(basePrompt, 3);
  console.log('Multiple version generation approach:');
  console.log(scPrompt.layers.reasoning?.substring(0, 200) + '...');
  
  console.log('\n🔍 Self-Critique Pattern:');
  const critiquePrompt = AdvancedReasoningManager.applySelfCritique(basePrompt);
  console.log('Quality review and refinement:');
  console.log(critiquePrompt.layers.critique?.substring(0, 200) + '...');
}

function demonstratePromptTemplates() {
  console.log('\n🔹 Demo 5: Prompt Template Analysis');
  console.log('-'.repeat(60));
  
  const templates = HumanizationPromptFactory.getAllTemplates();
  
  console.log(`\n📋 Available Templates: ${templates.length}`);
  
  templates.forEach(template => {
    console.log(`\n📄 ${template.name}:`);
    console.log(`  Category: ${template.category}`);
    console.log(`  Layers: ${template.layers.length}`);
    console.log(`  Tags: ${template.metadata.tags.join(', ')}`);
    console.log(`  Version: ${template.version}`);
    
    // Show layer structure
    const layerTypes = template.layers.map(l => l.type);
    console.log(`  Structure: ${layerTypes.join(' → ')}`);
  });
  
  // Show template selection logic
  console.log('\n🎯 Template Selection Examples:');
  
  const scenarios = [
    { content: 'general', premium: false, mode: 'default' as const },
    { content: 'academic', premium: true, mode: 'personal-touch' as const },
    { content: 'business', premium: false, mode: 'default' as const },
    { content: 'creative', premium: true, mode: 'personal-touch' as const }
  ];
  
  scenarios.forEach(scenario => {
    const selectedTemplate = HumanizationPromptFactory.getTemplateByContentType(
      scenario.content as any,
      scenario.premium
    );
    
    console.log(`  ${scenario.content} + ${scenario.premium ? 'Premium' : 'Standard'}: ${selectedTemplate.name}`);
  });
}

// Helper function to create sample chunks from text
function createChunksFromText(text: string, chunkSize: number = 300): TextChunk[] {
  const words = text.trim().split(/\s+/);
  const chunks: TextChunk[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const content = chunkWords.join(' ');
    const startIndex = i > 0 ? chunks[i - 1].endIndex : 0;
    
    chunks.push({
      id: `chunk_${chunks.length + 1}`,
      content,
      startIndex,
      endIndex: startIndex + content.length,
      tokenCount: Math.ceil(content.length / 4),
      metadata: {
        boundaryType: 'word'
      }
    });
  }
  
  return chunks;
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstratePromptEngineering()
    .then(() => {
      console.log('\n🎉 Demo completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

export { demonstratePromptEngineering, createChunksFromText };
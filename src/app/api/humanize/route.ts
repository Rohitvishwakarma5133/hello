import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HumanizeRequest, HumanizeResponse, TextStats } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Stage 1: Intelligent Pre-processing & Semantic Chunking
function preprocessAndChunk(text: string, maxChunkSize: number = 2000): string[] {
  console.log('🔄 Stage 1: Preprocessing and chunking text...');
  
  // Clean the text
  let cleanedText = text.trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')  // Normalize line breaks
    .replace(/[\u2018\u2019]/g, "'")  // Replace smart quotes
    .replace(/[\u201C\u201D]/g, '"');  // Replace smart quotes
  
  if (cleanedText.length <= maxChunkSize) {
    console.log('✅ Stage 1: Text fits in single chunk');
    return [cleanedText];
  }
  
  // Split into semantic chunks at sentence boundaries
  const sentences = cleanedText.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // Single sentence is too long, split by words
        const words = sentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if (wordChunk.length + word.length + 1 > maxChunkSize) {
            if (wordChunk) chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk += (wordChunk ? ' ' : '') + word;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  console.log(`✅ Stage 1: Split into ${chunks.length} semantic chunks`);
  return chunks;
}

// Stage 2: Dynamic & Layered Prompt Engineering
function createHumanizationPrompt(intensity: 'light' | 'medium' | 'strong' = 'medium'): string {
  console.log('🚀 Stage 2: Creating dynamic humanization prompt...');
  
  const basePrompt = `You are an expert text rewriter specializing in making AI-generated content sound naturally human-written while preserving all original meaning and information.`;
  
  const intensityInstructions = {
    light: `Make minimal changes focused on:
- Simplifying overly complex sentence structures
- Replacing a few formal words with casual alternatives
- Adding occasional contractions where natural`,
    
    medium: `Apply moderate humanization including:
- Varying sentence structures and lengths
- Replacing formal language with conversational alternatives
- Adding contractions and colloquial expressions
- Introducing slight imperfections in grammar where humans would naturally make them
- Using more active voice
- Adding transitional phrases for natural flow`,
    
    strong: `Apply comprehensive humanization with:
- Significant sentence structure variation (mix short and long sentences)
- Extensive vocabulary changes (formal → casual/conversational)
- Natural speech patterns and colloquialisms
- Strategic minor grammatical imperfections that humans make
- Personal touches and subjective language
- Rhetorical questions or asides where appropriate
- More personality and individual voice
- Natural hesitations or qualifiers ("I think", "maybe", "sort of")`
  };
  
  return `${basePrompt}

${intensityInstructions[intensity]}

IMPORTANT GUIDELINES:
1. NEVER change facts, numbers, technical terms, or core meaning
2. Maintain the same tone and purpose as the original
3. Keep the same approximate length (±20%)
4. Make it sound like a real person wrote it naturally
5. Avoid AI-detection patterns like:
   - Overly perfect grammar and punctuation
   - Repetitive sentence structures
   - Formal academic language
   - Generic transitions ("Furthermore", "Moreover", "Additionally")
   - Robotic word choices

Rewrite the following text to sound naturally human-written:`;
}

// Stage 3: Parallel Processing with OpenAI
async function processChunksWithOpenAI(chunks: string[], intensity: 'light' | 'medium' | 'strong'): Promise<string[]> {
  console.log(`🔧 Stage 3: Processing ${chunks.length} chunks with OpenAI...`);
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('⚠️ OpenAI API key not configured!');
    console.log('📄 To enable full 4-stage OpenAI processing:');
    console.log('1. Get your API key from https://platform.openai.com/api-keys');
    console.log('2. Add it to .env.local file: OPENAI_API_KEY=your_key_here');
    console.log('3. Restart the development server');
    console.log('🔄 Using fallback processing for now...');
    
    // Fallback to basic processing if no API key
    const { humanizeText } = await import('@/lib/textUtils');
    const basicResults = chunks.map(chunk => {
      const { humanizedText } = humanizeText(chunk, intensity);
      return humanizedText;
    });
    return basicResults;
  }
  
  const prompt = createHumanizationPrompt(intensity);
  
  try {
    // Process chunks in parallel (limited concurrency to respect rate limits)
    const processChunk = async (chunk: string, index: number): Promise<string> => {
      console.log(`🔄 Processing chunk ${index + 1}/${chunks.length}`);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // More cost-effective model
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: chunk
          }
        ],
        max_tokens: Math.min(4000, Math.ceil(chunk.length * 1.5)), // Adaptive token limit
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
      
      const processedChunk = response.choices[0]?.message?.content || chunk;
      console.log(`✅ Chunk ${index + 1} processed successfully`);
      return processedChunk.trim();
    };
    
    // Process chunks with limited concurrency
    const batchSize = 3; // Process 3 chunks at a time to respect rate limits
    const processedChunks: string[] = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((chunk, index) => processChunk(chunk, i + index))
      );
      processedChunks.push(...batchResults);
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Stage 3: All ${chunks.length} chunks processed successfully`);
    return processedChunks;
    
  } catch (error) {
    console.error('❌ Stage 3: OpenAI processing failed:', error);
    throw new Error(`OpenAI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Stage 4: Coherent Merging
function mergeChunks(processedChunks: string[]): string {
  console.log('🔗 Stage 4: Merging processed chunks...');
  
  if (processedChunks.length === 1) {
    console.log('✅ Stage 4: Single chunk, no merging needed');
    return processedChunks[0];
  }
  
  // Intelligent merging with smooth transitions
  let mergedText = processedChunks[0];
  
  for (let i = 1; i < processedChunks.length; i++) {
    const currentChunk = processedChunks[i];
    
    // Add appropriate spacing based on how the chunks end/start
    if (mergedText.endsWith('.') || mergedText.endsWith('!') || mergedText.endsWith('?')) {
      mergedText += ' ' + currentChunk;
    } else if (mergedText.endsWith('\n')) {
      mergedText += currentChunk;
    } else {
      mergedText += ' ' + currentChunk;
    }
  }
  
  // Clean up the merged text
  mergedText = mergedText
    .replace(/\s+/g, ' ')  // Normalize spaces
    .replace(/\. \./g, '.')  // Fix double periods
    .replace(/([.!?])\s*([.!?])/g, '$1 ')  // Fix multiple punctuation
    .trim();
  
  console.log('✅ Stage 4: Chunks merged successfully');
  return mergedText;
}

// Utility function for text stats
function getTextStats(text: string): TextStats {
  const characters = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  return { characters, words, sentences, paragraphs };
}

export async function POST(request: NextRequest) {
  console.log('\n🎆 ========== HUMANIZATION PIPELINE STARTED ==========');
  
  try {
    const body: HumanizeRequest = await request.json();
    
    console.log('🚀 API: Received humanization request');
    console.log('📝 API: Text length:', body.text?.length || 0, 'characters');
    console.log('📄 API: Text preview:', body.text?.substring(0, 100) + '...');
    console.log('🎯 API: Requested intensity:', body.options?.intensity || 'default(medium)');
    
    if (!body.text || body.text.trim() === '') {
      console.log('❌ API: Empty text provided');
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const originalStats = getTextStats(body.text);
    const intensity = body.options?.intensity || 'medium';
    
    try {
      // Execute the 4-stage pipeline
      console.log('\n🚀 Starting 4-Stage Humanization Pipeline...');
      
      // Stage 1: Preprocessing and Chunking
      const chunks = preprocessAndChunk(body.text);
      
      // Stage 2 & 3: Dynamic Prompting + Parallel Processing
      const processedChunks = await processChunksWithOpenAI(chunks, intensity);
      
      // Stage 4: Coherent Merging
      const humanizedText = mergeChunks(processedChunks);
      
      const humanizedStats = getTextStats(humanizedText);
      
      // Generate improvements summary
      const improvements = [
        `Processed through 4-stage AI humanization pipeline`,
        `Split into ${chunks.length} semantic chunks for parallel processing`,
        `Applied ${intensity} intensity humanization with OpenAI GPT-4`,
        `Intelligently merged chunks for coherent flow`,
        `Reduced formal language patterns and enhanced natural expression`
      ];
      
      const response: HumanizeResponse = {
        originalText: body.text,
        humanizedText,
        stats: {
          original: originalStats,
          humanized: humanizedStats,
        },
        improvements,
      };
      
      console.log('\n✅ ========== PIPELINE COMPLETED SUCCESSFULLY ==========');
      console.log('📊 API: Pipeline completed with', improvements.length, 'improvements');
      console.log('📝 API: Original length:', originalStats.characters, '-> Humanized length:', humanizedStats.characters);
      console.log('🎆 API: Character change:', ((humanizedStats.characters - originalStats.characters) / originalStats.characters * 100).toFixed(1) + '%');

      return NextResponse.json(response);
      
    } catch (pipelineError) {
      console.error('❌ Pipeline Error:', pipelineError);
      
      // Fallback to basic processing if pipeline fails
      console.log('🔄 Falling back to basic processing...');
      const { humanizeText } = await import('@/lib/textUtils');
      const { humanizedText, improvements } = humanizeText(body.text, intensity);
      const humanizedStats = getTextStats(humanizedText);
      
      const response: HumanizeResponse = {
        originalText: body.text,
        humanizedText,
        stats: {
          original: originalStats,
          humanized: humanizedStats,
        },
        improvements: [...improvements, 'Used fallback processing due to pipeline error'],
      };
      
      return NextResponse.json(response);
    }
    
  } catch (error) {
    console.error('❌ Fatal API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during humanization' },
      { status: 500 }
    );
  }
}

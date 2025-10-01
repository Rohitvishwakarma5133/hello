import { TextChunk } from '../interfaces/chunking-interfaces';

/**
 * Utility class for text processing and token counting
 */
export class TextUtils {
  /**
   * Approximate token count using a simple heuristic
   * More accurate tokenization would require a proper tokenizer like GPT-3's
   */
  static countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    // This is a simplified approach; in production, use a proper tokenizer
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    
    // Combined heuristic: average of word-based and character-based estimates
    const wordBasedTokens = words.length;
    const charBasedTokens = Math.ceil(characters / 4);
    
    return Math.max(wordBasedTokens, Math.ceil(charBasedTokens * 0.75));
  }

  /**
   * Generate a unique ID for a chunk
   */
  static generateChunkId(index: number, startPos: number): string {
    const timestamp = Date.now().toString(36);
    return `chunk_${index}_${startPos}_${timestamp}`;
  }

  /**
   * Split text by multiple separators in order of preference
   */
  static splitByHierarchy(text: string, separators: string[]): string[] {
    for (const separator of separators) {
      if (text.includes(separator)) {
        const parts = text.split(separator);
        if (parts.length > 1) {
          // Reconstruct with separator for all but last part
          return parts.slice(0, -1).map(part => part + separator)
            .concat(parts[parts.length - 1]);
        }
      }
    }
    return [text];
  }

  /**
   * Create overlapping chunks by adding context from adjacent chunks
   */
  static addOverlap(chunks: TextChunk[], overlapPercentage: number): TextChunk[] {
    if (chunks.length <= 1 || overlapPercentage <= 0) {
      return chunks;
    }

    const overlappingChunks: TextChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let content = chunk.content;
      let overlapStart = 0;
      let overlapEnd = 0;

      const overlapTokens = Math.ceil(chunk.tokenCount * (overlapPercentage / 100));

      // Add overlap from previous chunk
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        const prevWords = prevChunk.content.split(/\s+/);
        const overlapWords = Math.min(overlapTokens, prevWords.length);
        const overlapText = prevWords.slice(-overlapWords).join(' ');
        
        if (overlapText.trim()) {
          content = overlapText + ' ' + content;
          overlapStart = TextUtils.countTokens(overlapText);
        }
      }

      // Add overlap to next chunk (just for metadata tracking)
      if (i < chunks.length - 1) {
        const nextChunk = chunks[i + 1];
        const currentWords = chunk.content.split(/\s+/);
        const overlapWords = Math.min(overlapTokens, currentWords.length);
        overlapEnd = overlapWords;
      }

      overlappingChunks.push({
        ...chunk,
        content,
        tokenCount: TextUtils.countTokens(content),
        metadata: {
          ...chunk.metadata,
          overlapStart,
          overlapEnd
        }
      });
    }

    return overlappingChunks;
  }

  /**
   * Extract sentences from text for semantic analysis
   */
  static extractSentences(text: string): string[] {
    // Simple sentence splitting - in production, consider using a more sophisticated approach
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Get boundary sentences for semantic validation
   */
  static getBoundaryContext(chunk1: TextChunk, chunk2: TextChunk): { 
    chunk1LastSentence: string; 
    chunk2FirstSentence: string 
  } {
    const sentences1 = TextUtils.extractSentences(chunk1.content);
    const sentences2 = TextUtils.extractSentences(chunk2.content);

    return {
      chunk1LastSentence: sentences1[sentences1.length - 1] || '',
      chunk2FirstSentence: sentences2[0] || ''
    };
  }

  /**
   * Merge two adjacent chunks
   */
  static mergeChunks(chunk1: TextChunk, chunk2: TextChunk): TextChunk {
    const mergedContent = chunk1.content + ' ' + chunk2.content;
    
    return {
      id: TextUtils.generateChunkId(0, chunk1.startIndex),
      content: mergedContent,
      startIndex: chunk1.startIndex,
      endIndex: chunk2.endIndex,
      tokenCount: TextUtils.countTokens(mergedContent),
      metadata: {
        boundaryType: 'semantic',
        semanticScore: (chunk1.metadata?.semanticScore || 0 + chunk2.metadata?.semanticScore || 0) / 2
      }
    };
  }

  /**
   * Validate chunk size constraints
   */
  static isValidChunkSize(chunk: TextChunk, minSize: number, maxSize: number): boolean {
    return chunk.tokenCount >= minSize && chunk.tokenCount <= maxSize;
  }

  /**
   * Clean and normalize text
   */
  static normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Calculate percentile for semantic distance threshold
   */
  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }
}
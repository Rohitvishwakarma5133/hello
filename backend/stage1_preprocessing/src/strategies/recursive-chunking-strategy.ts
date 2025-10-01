import { 
  ChunkingStrategy, 
  TextChunk, 
  ChunkingConfig, 
  UserContext 
} from '../interfaces/chunking-interfaces';
import { TextUtils } from '../utils/text-utils';

/**
 * Recursive Character Text Splitter
 * Implements hierarchical splitting using a priority list of separators
 * First tries to split by paragraphs, then sentences, then words, etc.
 */
export class RecursiveChunkingStrategy implements ChunkingStrategy {
  getName(): string {
    return 'RecursiveCharacterSplitter';
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

    // If text is smaller than max chunk size, return as single chunk
    const totalTokens = TextUtils.countTokens(normalizedText);
    if (totalTokens <= config.maxTokens) {
      return [{
        id: TextUtils.generateChunkId(0, 0),
        content: normalizedText,
        startIndex: 0,
        endIndex: normalizedText.length,
        tokenCount: totalTokens,
        metadata: {
          boundaryType: 'paragraph'
        }
      }];
    }

    // Perform recursive splitting
    const chunks = this.recursiveSplit(
      normalizedText, 
      config.separators, 
      config.maxTokens,
      config.minChunkSize
    );

    // Apply overlap
    const overlappedChunks = TextUtils.addOverlap(chunks, config.overlapPercentage);

    return overlappedChunks;
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    maxTokens: number,
    minChunkSize: number,
    startIndex: number = 0
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    
    // Base case: if text fits in one chunk
    const tokenCount = TextUtils.countTokens(text);
    if (tokenCount <= maxTokens) {
      if (tokenCount >= minChunkSize) {
        chunks.push({
          id: TextUtils.generateChunkId(chunks.length, startIndex),
          content: text.trim(),
          startIndex,
          endIndex: startIndex + text.length,
          tokenCount,
          metadata: {
            boundaryType: this.getBoundaryType(separators[0])
          }
        });
      }
      return chunks;
    }

    // Try to split with the first separator
    const separator = separators[0];
    const splits = this.splitText(text, separator);
    
    if (splits.length === 1) {
      // If no split occurred, try the next separator
      if (separators.length > 1) {
        return this.recursiveSplit(text, separators.slice(1), maxTokens, minChunkSize, startIndex);
      } else {
        // Last resort: character-level splitting
        return this.characterSplit(text, maxTokens, minChunkSize, startIndex);
      }
    }

    // Process each split
    let currentIndex = startIndex;
    let currentChunk = '';
    let currentTokens = 0;

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const splitTokens = TextUtils.countTokens(split);

      // If adding this split would exceed max tokens, finalize current chunk
      if (currentTokens + splitTokens > maxTokens && currentChunk.trim()) {
        if (currentTokens >= minChunkSize) {
          chunks.push({
            id: TextUtils.generateChunkId(chunks.length, currentIndex - currentChunk.length),
            content: currentChunk.trim(),
            startIndex: currentIndex - currentChunk.length,
            endIndex: currentIndex,
            tokenCount: currentTokens,
            metadata: {
              boundaryType: this.getBoundaryType(separator)
            }
          });
        }
        currentChunk = '';
        currentTokens = 0;
        currentIndex = startIndex + text.indexOf(split, currentIndex - startIndex);
      }

      // Add current split to chunk
      currentChunk += split;
      currentTokens += splitTokens;
      currentIndex += split.length;

      // If current split alone exceeds max tokens, recursively split it
      if (splitTokens > maxTokens) {
        const subChunks = this.recursiveSplit(
          split,
          separators.slice(1),
          maxTokens,
          minChunkSize,
          currentIndex - split.length
        );
        chunks.push(...subChunks);
        currentChunk = '';
        currentTokens = 0;
      }
    }

    // Add remaining chunk if it meets minimum size
    if (currentChunk.trim() && currentTokens >= minChunkSize) {
      chunks.push({
        id: TextUtils.generateChunkId(chunks.length, currentIndex - currentChunk.length),
        content: currentChunk.trim(),
        startIndex: currentIndex - currentChunk.length,
        endIndex: currentIndex,
        tokenCount: currentTokens,
        metadata: {
          boundaryType: this.getBoundaryType(separator)
        }
      });
    }

    return chunks;
  }

  private splitText(text: string, separator: string): string[] {
    if (!separator) {
      // Character-level split
      return text.split('');
    }
    
    const parts = text.split(separator);
    
    if (parts.length === 1) {
      return parts;
    }

    // Preserve separators (except for the last part)
    const result: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
      result.push(parts[i] + separator);
    }
    result.push(parts[parts.length - 1]);
    
    return result.filter(part => part.trim().length > 0);
  }

  private characterSplit(
    text: string, 
    maxTokens: number, 
    minChunkSize: number, 
    startIndex: number
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const words = text.split(/\s+/);
    
    let currentChunk = '';
    let currentTokens = 0;
    let wordStartIndex = startIndex;

    for (const word of words) {
      const wordTokens = TextUtils.countTokens(word);
      
      if (currentTokens + wordTokens > maxTokens && currentChunk.trim()) {
        if (currentTokens >= minChunkSize) {
          chunks.push({
            id: TextUtils.generateChunkId(chunks.length, wordStartIndex),
            content: currentChunk.trim(),
            startIndex: wordStartIndex,
            endIndex: wordStartIndex + currentChunk.length,
            tokenCount: currentTokens,
            metadata: {
              boundaryType: 'word'
            }
          });
        }
        
        currentChunk = word + ' ';
        currentTokens = wordTokens;
        wordStartIndex = startIndex + text.indexOf(word, wordStartIndex - startIndex);
      } else {
        currentChunk += word + ' ';
        currentTokens += wordTokens;
      }
    }

    // Add final chunk
    if (currentChunk.trim() && currentTokens >= minChunkSize) {
      chunks.push({
        id: TextUtils.generateChunkId(chunks.length, wordStartIndex),
        content: currentChunk.trim(),
        startIndex: wordStartIndex,
        endIndex: wordStartIndex + currentChunk.length,
        tokenCount: currentTokens,
        metadata: {
          boundaryType: 'word'
        }
      });
    }

    return chunks;
  }

  private getBoundaryType(separator: string): 'paragraph' | 'sentence' | 'word' | 'semantic' {
    if (separator === '\n\n' || separator === '\n\n\n') return 'paragraph';
    if (separator === '. ' || separator === '! ' || separator === '? ') return 'sentence';
    if (separator === ' ') return 'word';
    return 'paragraph'; // default
  }

  validateChunk(chunk: TextChunk): boolean {
    return (
      chunk.content.trim().length > 0 &&
      chunk.tokenCount > 0 &&
      chunk.endIndex > chunk.startIndex &&
      chunk.id.length > 0
    );
  }
}
export interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

export interface HumanizeRequest {
  text: string;
  options?: {
    intensity: 'light' | 'medium' | 'strong';
    preserveFormatting: boolean;
  };
}

export interface HumanizeResponse {
  originalText: string;
  humanizedText: string;
  stats: {
    original: TextStats;
    humanized: TextStats;
  };
  improvements: string[];
}
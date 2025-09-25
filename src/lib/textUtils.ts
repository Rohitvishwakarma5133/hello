import { TextStats } from '@/types';

export function getTextStats(text: string): TextStats {
  const characters = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

  return { characters, words, sentences, paragraphs };
}

export function humanizeText(text: string, intensity: 'light' | 'medium' | 'strong' = 'medium'): { humanizedText: string; improvements: string[] } {
  let humanizedText = text;
  const improvements: string[] = [];

  // Remove excessive punctuation
  if (humanizedText.includes('!!!') || humanizedText.includes('???')) {
    humanizedText = humanizedText.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?');
    improvements.push('Reduced excessive punctuation');
  }

  // Replace overly formal phrases
  const formalReplacements: { [key: string]: string[] } = {
    'in order to': ['to', 'so we can'],
    'due to the fact that': ['because', 'since'],
    'at this point in time': ['now', 'currently'],
    'it is important to note that': ['note that', 'remember that'],
    'in the event that': ['if', 'when'],
    'for the purpose of': ['to', 'for'],
    'in regard to': ['about', 'regarding'],
    'make a decision': ['decide'],
    'come to a conclusion': ['conclude'],
    'take into consideration': ['consider'],
  };

  Object.entries(formalReplacements).forEach(([formal, casual]) => {
    const regex = new RegExp(formal, 'gi');
    if (regex.test(humanizedText)) {
      const replacement = casual[Math.floor(Math.random() * casual.length)];
      humanizedText = humanizedText.replace(regex, replacement);
      improvements.push(`Simplified "${formal}" to "${replacement}"`);
    }
  });

  // Add contractions
  const contractions: { [key: string]: string } = {
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'will not': "won't",
    'would not': "wouldn't",
    'could not': "couldn't",
    'should not': "shouldn't",
    'cannot': "can't",
    'is not': "isn't",
    'are not': "aren't",
    'was not': "wasn't",
    'were not': "weren't",
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",
    'it is': "it's",
    'that is': "that's",
    'there is': "there's",
    'here is': "here's",
    'what is': "what's",
    'where is': "where's",
    'who is': "who's",
    'how is': "how's",
    'I am': "I'm",
    'you are': "you're",
    'we are': "we're",
    'they are': "they're",
    'I will': "I'll",
    'you will': "you'll",
    'we will': "we'll",
    'they will': "they'll",
    'I would': "I'd",
    'you would': "you'd",
    'we would': "we'd",
    'they would': "they'd",
  };

  if (intensity === 'medium' || intensity === 'strong') {
    Object.entries(contractions).forEach(([full, contraction]) => {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      if (regex.test(humanizedText)) {
        humanizedText = humanizedText.replace(regex, contraction);
        improvements.push(`Added contraction: "${full}" → "${contraction}"`);
      }
    });
  }

  // Vary sentence starters
  const sentences = humanizedText.split(/([.!?]+)/).filter(s => s.trim().length > 0);
  let modifiedSentences = false;
  
  for (let i = 0; i < sentences.length; i += 2) {
    let sentence = sentences[i].trim();
    
    // Add casual starters occasionally
    if (intensity === 'strong' && Math.random() < 0.3 && sentence.length > 20) {
      const starters = ['Well, ', 'So, ', 'Actually, ', 'You know, ', 'By the way, '];
      if (!sentence.match(/^(Well|So|Actually|You know|By the way),/i)) {
        const starter = starters[Math.floor(Math.random() * starters.length)];
        sentence = starter + sentence.charAt(0).toLowerCase() + sentence.slice(1);
        sentences[i] = sentence;
        modifiedSentences = true;
      }
    }
    
    // Replace "Additionally" and similar formal connectors
    sentence = sentence.replace(/^Additionally,/i, 'Also,');
    sentence = sentence.replace(/^Furthermore,/i, 'Plus,');
    sentence = sentence.replace(/^Moreover,/i, 'What\'s more,');
    sentence = sentence.replace(/^Nevertheless,/i, 'Still,');
    sentence = sentence.replace(/^However,/i, 'But,');
    
    sentences[i] = sentence;
  }
  
  if (modifiedSentences) {
    humanizedText = sentences.join('');
    improvements.push('Added casual sentence starters');
  }

  // Replace passive voice with active voice (basic patterns)
  const passivePatterns = [
    { pattern: /was ([\w]+ed) by/, replacement: '$2 $1' },
    { pattern: /were ([\w]+ed) by/, replacement: '$2 $1' },
    { pattern: /is ([\w]+ed) by/, replacement: '$2 $1s' },
    { pattern: /are ([\w]+ed) by/, replacement: '$2 $1' },
  ];

  passivePatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(humanizedText)) {
      humanizedText = humanizedText.replace(pattern, replacement);
      improvements.push('Converted passive voice to active voice');
    }
  });

  // Add transition words for better flow
  if (intensity === 'strong') {
    // This is a simple implementation - in a real app, you'd want more sophisticated NLP
    humanizedText = humanizedText.replace(/\. ([A-Z])/g, (match, letter) => {
      const transitions = ['. Also, ', '. Plus, ', '. And ', '. But '];
      if (Math.random() < 0.2) {
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        improvements.push('Added transition words for better flow');
        return transition + letter.toLowerCase();
      }
      return match;
    });
  }

  return { humanizedText, improvements };
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'absolute';
    textArea.style.left = '-999999px';
    document.body.prepend(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      return Promise.resolve(true);
    } catch {
      textArea.remove();
      return Promise.resolve(false);
    }
  }
}
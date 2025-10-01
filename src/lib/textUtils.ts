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
  
  console.log('🔧 Starting humanization with intensity:', intensity);
  console.log('📝 Original text length:', text.length, 'characters');
  console.log('📄 Original text preview:', text.substring(0, 100) + '...');

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
    'a large number of': ['many', 'lots of'],
    'a great deal of': ['much', 'lots of'],
    'prior to': ['before'],
    'subsequent to': ['after'],
    'with regard to': ['about', 'regarding'],
    'in relation to': ['about', 'regarding'],
    'for the reason that': ['because', 'since'],
    'in spite of the fact that': ['although', 'even though'],
    'during the time that': ['while'],
    'at the present time': ['now', 'currently'],
    'in the near future': ['soon'],
    'at a later date': ['later'],
    'in the final analysis': ['finally', 'in the end'],
    'for all intents and purposes': ['basically', 'essentially'],
    'give consideration to': ['consider'],
    'make an attempt': ['try'],
    'put forth the effort': ['try'],
    'conduct an investigation': ['investigate'],
    'perform an analysis': ['analyze'],
    'utilize': ['use'],
    'demonstrate': ['show'],
    'indicate': ['show'],
    'facilitate': ['help', 'make easier'],
    'endeavor': ['try'],
    'ascertain': ['find out'],
    'commence': ['start', 'begin'],
    'terminate': ['end', 'stop'],
    'implement': ['carry out', 'do'],
    'methodology': ['method', 'way'],
    'optimization': ['improvement'],
    'enhancement': ['improvement'],
    'modification': ['change'],
    'transformation': ['change'],
    'acquisition': ['getting', 'buying'],
    'accommodation': ['room', 'space'],
    'approximation': ['estimate', 'guess'],
    'classification': ['grouping', 'type'],
    'communication': ['message', 'talk'],
    'compensation': ['payment', 'pay'],
    'documentation': ['papers', 'records'],
    'establishment': ['setting up', 'creation'],
    'examination': ['check', 'review'],
    'expenditure': ['cost', 'expense'],
    'explanation': ['reason', 'answer'],
    'implementation': ['doing', 'carrying out'],
    'information': ['details', 'facts'],
    'investigation': ['study', 'research'],
    'maintenance': ['upkeep'],
    'observation': ['watching', 'seeing'],
    'participation': ['taking part'],
    'preparation': ['getting ready'],
    'recommendation': ['suggestion', 'advice'],
    'requirement': ['need'],
    'specification': ['detail', 'requirement'],
    'transportation': ['transport', 'travel'],
    'understanding': ['knowledge', 'grasp'],
  };

  Object.entries(formalReplacements).forEach(([formal, casual]) => {
    const regex = new RegExp(formal, 'gi');
    if (regex.test(humanizedText)) {
      const replacement = casual[Math.floor(Math.random() * casual.length)];
      humanizedText = humanizedText.replace(regex, replacement);
      improvements.push(`Simplified "${formal}" to "${replacement}"`);
      console.log('🔄 Replaced:', formal, '->', replacement);
    }
  });
  
  // Additional simple word replacements for more natural language
  const simpleReplacements: { [key: string]: string[] } = {
    'obtain': ['get'],
    'purchase': ['buy'],
    'assist': ['help'],
    'attempt': ['try'],
    'complete': ['finish', 'done'],
    'construct': ['build', 'make'],
    'contribute': ['help', 'give'],
    'eliminate': ['remove', 'get rid of'],
    'encounter': ['meet', 'find'],
    'generate': ['make', 'create'],
    'locate': ['find'],
    'maintain': ['keep'],
    'operate': ['run', 'work'],
    'possess': ['have', 'own'],
    'produce': ['make'],
    'provide': ['give'],
    'require': ['need'],
    'substantial': ['big', 'large'],
    'sufficient': ['enough'],
    'numerous': ['many'],
    'additional': ['more', 'extra'],
    'extremely': ['very', 'really'],
    'particularly': ['especially'],
    'significantly': ['a lot', 'much'],
    'approximately': ['about', 'around'],
    'consequently': ['so', 'therefore'],
    'furthermore': ['also', 'plus'],
    'nevertheless': ['but', 'however'],
    'therefore': ['so'],
    'thus': ['so'],
    'hence': ['so'],
    'accordingly': ['so'],
    'moreover': ['also', 'plus'],
  };
  
  Object.entries(simpleReplacements).forEach(([formal, casual]) => {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    if (regex.test(humanizedText)) {
      const replacement = casual[Math.floor(Math.random() * casual.length)];
      humanizedText = humanizedText.replace(regex, replacement);
      improvements.push(`Made more casual: "${formal}" → "${replacement}"`);
      console.log('🗣️ Simplified word:', formal, '->', replacement);
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

  console.log('✅ Humanization completed!');
  console.log('📊 Total improvements made:', improvements.length);
  console.log('📝 Final text length:', humanizedText.length, 'characters');
  console.log('📄 Final text preview:', humanizedText.substring(0, 100) + '...');
  console.log('🎆 Improvements:', improvements);
  
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
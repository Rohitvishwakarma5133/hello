"""
Punctuation Handling Module

This module provides functions to correct common punctuation errors and 
inconsistencies that could interfere with sentence-based splitting algorithms.

Features:
- Fixes extra punctuation marks (,,, .., !!! → ,, ., !)
- Adds missing spaces after punctuation (word.Sentence → word. Sentence)
- Standardizes quotation marks (" " → " or ')
- Handles ellipses and other special punctuation
- Normalizes apostrophes and contractions
"""

import re
import unicodedata
from typing import Dict, Any, Optional, List, Tuple


class PunctuationHandler:
    """
    A comprehensive punctuation normalization class that handles various
    punctuation errors and inconsistencies.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the handler with configuration options.
        
        Args:
            config: Optional configuration dictionary with punctuation settings
        """
        self.config = config or self._default_config()
        self._compile_patterns()
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for punctuation handling."""
        return {
            'fix_extra_punctuation': True,
            'add_missing_spaces': True,
            'standardize_quotes': True,
            'preferred_quote_style': 'double',  # 'double' or 'single'
            'normalize_ellipses': True,
            'normalize_apostrophes': True,
            'fix_sentence_spacing': True,
            'preserve_code_blocks': True,
            'max_consecutive_punctuation': 3,  # Max allowed consecutive punctuation
            'smart_quote_conversion': True
        }
    
    def _compile_patterns(self):
        """Compile regex patterns for efficient processing."""
        # Pattern for multiple consecutive periods
        self.multiple_periods_pattern = re.compile(r'\.{4,}')
        
        # Pattern for multiple consecutive commas
        self.multiple_commas_pattern = re.compile(r',{2,}')
        
        # Pattern for multiple consecutive exclamations
        self.multiple_exclamations_pattern = re.compile(r'!{4,}')
        
        # Pattern for multiple consecutive questions
        self.multiple_questions_pattern = re.compile(r'\?{4,}')
        
        # Pattern for missing spaces after punctuation
        self.missing_space_pattern = re.compile(r'([.!?,:;])([A-Za-z])')
        
        # Pattern for excessive spaces before punctuation
        self.excessive_space_before_punct_pattern = re.compile(r'\s+([.!?,:;])')
        
        # Patterns for various quote types
        self.curly_quotes_pattern = re.compile(r'[""''‚„]')
        self.angle_quotes_pattern = re.compile(r'[«»‹›]')
        
        # Pattern for various apostrophe types
        self.apostrophe_pattern = re.compile(r'[''`´]')
        
        # Pattern for ellipses variants
        self.ellipses_pattern = re.compile(r'\.{3,}|…+')
        
        # Pattern for em and en dashes
        self.dash_pattern = re.compile(r'[—–]')
        
        # Pattern for code blocks (to preserve them)
        self.code_block_pattern = re.compile(r'```[\s\S]*?```|`[^`]*`', re.MULTILINE)
    
    def _preserve_code_blocks(self, text: str) -> Tuple[str, List[str]]:
        """
        Temporarily remove code blocks to prevent punctuation changes within them.
        
        Args:
            text: Input text that may contain code blocks
            
        Returns:
            Tuple of (text_without_code, list_of_code_blocks)
        """
        if not self.config['preserve_code_blocks']:
            return text, []
        
        code_blocks = []
        
        def replace_code_block(match):
            code_blocks.append(match.group(0))
            return f"__CODE_BLOCK_{len(code_blocks) - 1}__"
        
        text_without_code = self.code_block_pattern.sub(replace_code_block, text)
        return text_without_code, code_blocks
    
    def _restore_code_blocks(self, text: str, code_blocks: List[str]) -> str:
        """
        Restore code blocks that were temporarily removed.
        
        Args:
            text: Text with code block placeholders
            code_blocks: List of original code blocks
            
        Returns:
            Text with restored code blocks
        """
        for i, code_block in enumerate(code_blocks):
            placeholder = f"__CODE_BLOCK_{i}__"
            text = text.replace(placeholder, code_block)
        
        return text
    
    def fix_extra_punctuation(self, text: str) -> str:
        """
        Fix excessive consecutive punctuation marks.
        
        Args:
            text: Input text with potential extra punctuation
            
        Returns:
            Text with normalized punctuation
        """
        if not self.config['fix_extra_punctuation']:
            return text
        
        max_punct = self.config['max_consecutive_punctuation']
        
        # Fix multiple periods (but preserve ellipses)
        text = self.multiple_periods_pattern.sub('.' * min(3, max_punct), text)
        
        # Fix multiple commas
        text = self.multiple_commas_pattern.sub(',', text)
        
        # Fix multiple exclamations
        text = self.multiple_exclamations_pattern.sub('!' * min(3, max_punct), text)
        
        # Fix multiple questions
        text = self.multiple_questions_pattern.sub('?' * min(3, max_punct), text)
        
        return text
    
    def add_missing_spaces(self, text: str) -> str:
        """
        Add missing spaces after punctuation marks.
        
        Args:
            text: Input text with potential missing spaces
            
        Returns:
            Text with proper spacing after punctuation
        """
        if not self.config['add_missing_spaces']:
            return text
        
        # Add space after punctuation when followed by a letter
        text = self.missing_space_pattern.sub(r'\1 \2', text)
        
        return text
    
    def fix_sentence_spacing(self, text: str) -> str:
        """
        Fix spacing issues around punctuation marks.
        
        Args:
            text: Input text with spacing issues
            
        Returns:
            Text with corrected spacing
        """
        if not self.config['fix_sentence_spacing']:
            return text
        
        # Remove excessive spaces before punctuation
        text = self.excessive_space_before_punct_pattern.sub(r'\1', text)
        
        return text
    
    def standardize_quotes(self, text: str) -> str:
        """
        Standardize quotation marks to a consistent style.
        
        Args:
            text: Input text with mixed quote styles
            
        Returns:
            Text with standardized quotes
        """
        if not self.config['standardize_quotes']:
            return text
        
        quote_style = self.config['preferred_quote_style']
        
        if quote_style == 'double':
            # Convert all quote variants to double quotes
            text = self.curly_quotes_pattern.sub('"', text)
            text = self.angle_quotes_pattern.sub('"', text)
        elif quote_style == 'single':
            # Convert all quote variants to single quotes
            text = self.curly_quotes_pattern.sub("'", text)
            text = self.angle_quotes_pattern.sub("'", text)
        
        return text
    
    def normalize_apostrophes(self, text: str) -> str:
        """
        Normalize apostrophes to standard ASCII apostrophe.
        
        Args:
            text: Input text with various apostrophe types
            
        Returns:
            Text with normalized apostrophes
        """
        if not self.config['normalize_apostrophes']:
            return text
        
        # Convert all apostrophe variants to standard apostrophe
        text = self.apostrophe_pattern.sub("'", text)
        
        return text
    
    def normalize_ellipses(self, text: str) -> str:
        """
        Normalize ellipses to consistent format.
        
        Args:
            text: Input text with various ellipses formats
            
        Returns:
            Text with normalized ellipses
        """
        if not self.config['normalize_ellipses']:
            return text
        
        # Convert all ellipses variants to three periods
        text = self.ellipses_pattern.sub('...', text)
        
        return text
    
    def normalize_dashes(self, text: str) -> str:
        """
        Normalize em and en dashes to consistent format.
        
        Args:
            text: Input text with various dash types
            
        Returns:
            Text with normalized dashes
        """
        # Convert em and en dashes to regular hyphens (or keep them as-is)
        # For now, we'll keep them as em dashes for better typography
        return text
    
    def smart_quote_conversion(self, text: str) -> str:
        """
        Apply smart quote conversion based on context.
        
        Args:
            text: Input text
            
        Returns:
            Text with contextually appropriate quotes
        """
        if not self.config['smart_quote_conversion']:
            return text
        
        # This is a simplified version - a full implementation would
        # track opening and closing quote context
        quote_char = '"' if self.config['preferred_quote_style'] == 'double' else "'"
        
        # Replace quotes at word boundaries
        text = re.sub(r'\b"([^"]*)"\b', f'{quote_char}\\1{quote_char}', text)
        
        return text
    
    def normalize(self, text: str) -> str:
        """
        Apply all punctuation normalization steps in the correct order.
        
        Args:
            text: Raw input text
            
        Returns:
            Text with normalized punctuation
        """
        if not text:
            return text
        
        # Preserve code blocks during processing
        text_without_code, code_blocks = self._preserve_code_blocks(text)
        
        # Step 1: Fix extra punctuation
        text_without_code = self.fix_extra_punctuation(text_without_code)
        
        # Step 2: Normalize ellipses
        text_without_code = self.normalize_ellipses(text_without_code)
        
        # Step 3: Normalize apostrophes
        text_without_code = self.normalize_apostrophes(text_without_code)
        
        # Step 4: Standardize quotes
        text_without_code = self.standardize_quotes(text_without_code)
        
        # Step 5: Apply smart quote conversion
        text_without_code = self.smart_quote_conversion(text_without_code)
        
        # Step 6: Fix sentence spacing
        text_without_code = self.fix_sentence_spacing(text_without_code)
        
        # Step 7: Add missing spaces
        text_without_code = self.add_missing_spaces(text_without_code)
        
        # Step 8: Normalize dashes
        text_without_code = self.normalize_dashes(text_without_code)
        
        # Restore code blocks
        result = self._restore_code_blocks(text_without_code, code_blocks)
        
        return result


def normalize_punctuation(text: str, config: Optional[Dict[str, Any]] = None) -> str:
    """
    Convenience function for quick punctuation normalization.
    
    Args:
        text: Input text to normalize
        config: Optional configuration dictionary
        
    Returns:
        Text with normalized punctuation
    """
    handler = PunctuationHandler(config)
    return handler.normalize(text)


# Example usage and test cases
if __name__ == "__main__":
    # Test cases for punctuation handling
    test_cases = [
        "Hello,,,world!!!How are you???",
        "This is a test.Next sentence here.",
        'He said,"Hello there!"and walked away.',
        "Don't you think it's amazing???",
        "Wait...what happened....here?",
        'She said "Hello" and he replied \'Hi\'.',
        "Multiple   spaces  before ,punctuation .",
        "Code example: `let x = 5;` should be preserved.",
        "```python\nprint('Hello, world!')\n```",
    ]
    
    handler = PunctuationHandler()
    
    print("Punctuation Normalization Test Results:")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Input: {repr(test_case)}")
        result = handler.normalize(test_case)
        print(f"Output: {repr(result)}")

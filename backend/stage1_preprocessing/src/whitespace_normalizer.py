"""
Whitespace Normalization Module

This module provides functions to standardize all forms of whitespace characters
in text, ensuring consistency for downstream processing.

Features:
- Converts tabs to spaces
- Normalizes multiple consecutive spaces to single spaces
- Standardizes line breaks (\\r\\n, \\r, \\n) to consistent format
- Removes non-breaking spaces and other Unicode whitespace variants
- Trims leading/trailing whitespace from lines while preserving structure
"""

import re
import unicodedata
from typing import Dict, Any, Optional


class WhitespaceNormalizer:
    """
    A comprehensive whitespace normalization class that handles various
    forms of whitespace inconsistencies in text.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the normalizer with configuration options.
        
        Args:
            config: Optional configuration dictionary with normalization settings
        """
        self.config = config or self._default_config()
        self._compile_patterns()
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for whitespace normalization."""
        return {
            'tab_to_spaces': 4,  # Convert tabs to 4 spaces
            'normalize_line_breaks': True,
            'line_break_style': '\n',  # Unix-style line breaks
            'remove_trailing_spaces': True,
            'normalize_unicode_spaces': True,
            'max_consecutive_spaces': 1,
            'preserve_paragraph_breaks': True,  # Keep double line breaks
            'trim_lines': True
        }
    
    def _compile_patterns(self):
        """Compile regex patterns for efficient processing."""
        # Pattern for various Unicode whitespace characters
        self.unicode_spaces_pattern = re.compile(r'[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]')
        
        # Pattern for multiple consecutive spaces
        self.multiple_spaces_pattern = re.compile(r' {2,}')
        
        # Pattern for line breaks (Windows, Mac, Unix)
        self.line_breaks_pattern = re.compile(r'\r\n|\r|\n')
        
        # Pattern for trailing spaces at end of lines
        self.trailing_spaces_pattern = re.compile(r' +$', re.MULTILINE)
        
        # Pattern for leading spaces that aren't indentation
        self.excessive_leading_spaces_pattern = re.compile(r'^[ \t]+', re.MULTILINE)
    
    def normalize_unicode_spaces(self, text: str) -> str:
        """
        Convert various Unicode space characters to regular spaces.
        
        Args:
            text: Input text with potential Unicode spaces
            
        Returns:
            Text with normalized spaces
        """
        if not self.config['normalize_unicode_spaces']:
            return text
        
        # Replace common Unicode space variants with regular spaces
        text = self.unicode_spaces_pattern.sub(' ', text)
        
        # Use Unicode normalization to handle other space variants
        text = unicodedata.normalize('NFKC', text)
        
        return text
    
    def normalize_tabs(self, text: str) -> str:
        """
        Convert tabs to spaces based on configuration.
        
        Args:
            text: Input text with potential tabs
            
        Returns:
            Text with tabs converted to spaces
        """
        spaces_per_tab = self.config['tab_to_spaces']
        if spaces_per_tab > 0:
            return text.replace('\t', ' ' * spaces_per_tab)
        return text
    
    def normalize_line_breaks(self, text: str) -> str:
        """
        Standardize line breaks to consistent format.
        
        Args:
            text: Input text with mixed line break styles
            
        Returns:
            Text with normalized line breaks
        """
        if not self.config['normalize_line_breaks']:
            return text
        
        line_break_style = self.config['line_break_style']
        return self.line_breaks_pattern.sub(line_break_style, text)
    
    def normalize_spaces(self, text: str) -> str:
        """
        Normalize multiple consecutive spaces to single spaces.
        
        Args:
            text: Input text with potential multiple spaces
            
        Returns:
            Text with normalized spacing
        """
        max_spaces = self.config['max_consecutive_spaces']
        if max_spaces == 1:
            return self.multiple_spaces_pattern.sub(' ', text)
        elif max_spaces > 1:
            pattern = re.compile(f' {{{max_spaces + 1},}}')
            return pattern.sub(' ' * max_spaces, text)
        return text
    
    def remove_trailing_spaces(self, text: str) -> str:
        """
        Remove trailing spaces from each line.
        
        Args:
            text: Input text with potential trailing spaces
            
        Returns:
            Text with trailing spaces removed
        """
        if not self.config['remove_trailing_spaces']:
            return text
        
        return self.trailing_spaces_pattern.sub('', text)
    
    def preserve_paragraph_structure(self, text: str) -> str:
        """
        Ensure paragraph breaks are preserved while normalizing other whitespace.
        
        Args:
            text: Input text
            
        Returns:
            Text with preserved paragraph structure
        """
        if not self.config['preserve_paragraph_breaks']:
            return text
        
        # Split into paragraphs, normalize each, then rejoin
        paragraphs = re.split(r'\n\s*\n', text)
        normalized_paragraphs = []
        
        for paragraph in paragraphs:
            # Normalize whitespace within paragraph
            paragraph = paragraph.strip()
            if paragraph:  # Skip empty paragraphs
                normalized_paragraphs.append(paragraph)
        
        return '\n\n'.join(normalized_paragraphs)
    
    def trim_lines(self, text: str) -> str:
        """
        Trim leading and trailing whitespace from each line.
        
        Args:
            text: Input text
            
        Returns:
            Text with trimmed lines
        """
        if not self.config['trim_lines']:
            return text
        
        lines = text.split('\n')
        trimmed_lines = [line.strip() for line in lines]
        return '\n'.join(trimmed_lines)
    
    def normalize(self, text: str) -> str:
        """
        Apply all whitespace normalization steps in the correct order.
        
        Args:
            text: Raw input text
            
        Returns:
            Normalized text with consistent whitespace
        """
        if not text:
            return text
        
        # Step 1: Normalize Unicode spaces first
        text = self.normalize_unicode_spaces(text)
        
        # Step 2: Convert tabs to spaces
        text = self.normalize_tabs(text)
        
        # Step 3: Normalize line breaks
        text = self.normalize_line_breaks(text)
        
        # Step 4: Remove trailing spaces from lines
        text = self.remove_trailing_spaces(text)
        
        # Step 5: Normalize multiple spaces
        text = self.normalize_spaces(text)
        
        # Step 6: Preserve paragraph structure if needed
        if self.config['preserve_paragraph_breaks']:
            text = self.preserve_paragraph_structure(text)
        elif self.config['trim_lines']:
            text = self.trim_lines(text)
        
        return text


def normalize_whitespace(text: str, config: Optional[Dict[str, Any]] = None) -> str:
    """
    Convenience function for quick whitespace normalization.
    
    Args:
        text: Input text to normalize
        config: Optional configuration dictionary
        
    Returns:
        Normalized text
    """
    normalizer = WhitespaceNormalizer(config)
    return normalizer.normalize(text)


# Example usage and test cases
if __name__ == "__main__":
    # Test cases for whitespace normalization
    test_cases = [
        "Multiple    spaces   between    words",
        "Text\twith\ttabs\there",
        "Mixed\r\nline\rbreaks\nhere",
        "Text with non-breaking\u00A0spaces",
        "Lines with trailing spaces   \nNext line   \n",
        """
        Paragraph one with    multiple spaces.
        
        
        Paragraph two    after multiple breaks.
        """,
    ]
    
    normalizer = WhitespaceNormalizer()
    
    print("Whitespace Normalization Test Results:")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Input: {repr(test_case)}")
        result = normalizer.normalize(test_case)
        print(f"Output: {repr(result)}")
"""
Structural Analysis Module

This module provides functions to detect and analyze document structure 
including headings, lists, paragraphs, and code blocks from Markdown, 
HTML, and mixed content.

Features:
- Markdown parsing (headings, lists, code blocks, tables, etc.)
- HTML structure detection (tags, hierarchy, content blocks)
- Code block identification (fenced blocks, inline code)
- Document hierarchy extraction
- Content type classification
"""

import re
from typing import Dict, List, Any, Optional, Tuple, NamedTuple
from dataclasses import dataclass
from enum import Enum
import html


class ElementType(Enum):
    """Types of structural elements in a document."""
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    LIST = "list"
    LIST_ITEM = "list_item"
    CODE_BLOCK = "code_block"
    INLINE_CODE = "inline_code"
    QUOTE = "quote"
    TABLE = "table"
    HTML_TAG = "html_tag"
    TEXT = "text"
    LINK = "link"
    IMAGE = "image"
    HORIZONTAL_RULE = "horizontal_rule"


@dataclass
class StructuralElement:
    """Represents a structural element in the document."""
    type: ElementType
    content: str
    level: int = 0  # For headings, list nesting, etc.
    attributes: Dict[str, Any] = None
    start_pos: int = 0
    end_pos: int = 0
    children: List['StructuralElement'] = None
    
    def __post_init__(self):
        if self.attributes is None:
            self.attributes = {}
        if self.children is None:
            self.children = []


class StructuralAnalyzer:
    """
    A comprehensive structural analysis class that detects and parses
    document structure from various markup formats.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the analyzer with configuration options.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or self._default_config()
        self._compile_patterns()
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for structural analysis."""
        return {
            'detect_markdown': True,
            'detect_html': True,
            'detect_code_blocks': True,
            'preserve_hierarchy': True,
            'extract_metadata': True,
            'normalize_headings': True,
            'detect_tables': True,
            'detect_links': True,
            'max_heading_level': 6,
            'code_languages': ['python', 'javascript', 'java', 'cpp', 'html', 'css', 'sql']
        }
    
    def _compile_patterns(self):
        """Compile regex patterns for efficient processing."""
        # Markdown patterns
        self.md_heading_pattern = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
        self.md_code_block_pattern = re.compile(r'^```(\w+)?\n(.*?)\n```$', re.MULTILINE | re.DOTALL)
        self.md_inline_code_pattern = re.compile(r'`([^`]+)`')
        self.md_list_pattern = re.compile(r'^(\s*)[-*+]\s+(.+)$', re.MULTILINE)
        self.md_ordered_list_pattern = re.compile(r'^(\s*)\d+\.\s+(.+)$', re.MULTILINE)
        self.md_quote_pattern = re.compile(r'^>\s+(.+)$', re.MULTILINE)
        self.md_link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
        self.md_image_pattern = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
        self.md_horizontal_rule_pattern = re.compile(r'^---+$', re.MULTILINE)
        self.md_table_pattern = re.compile(r'^\|(.+)\|$', re.MULTILINE)
        
        # HTML patterns
        self.html_tag_pattern = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>')
        self.html_heading_pattern = re.compile(r'<(h[1-6])[^>]*>(.*?)</\1>', re.IGNORECASE | re.DOTALL)
        self.html_paragraph_pattern = re.compile(r'<p[^>]*>(.*?)</p>', re.IGNORECASE | re.DOTALL)
        self.html_list_pattern = re.compile(r'<(ul|ol)[^>]*>(.*?)</\1>', re.IGNORECASE | re.DOTALL)
        self.html_list_item_pattern = re.compile(r'<li[^>]*>(.*?)</li>', re.IGNORECASE | re.DOTALL)
        self.html_code_pattern = re.compile(r'<code[^>]*>(.*?)</code>', re.IGNORECASE | re.DOTALL)
        self.html_pre_pattern = re.compile(r'<pre[^>]*>(.*?)</pre>', re.IGNORECASE | re.DOTALL)
        
        # General patterns
        self.whitespace_pattern = re.compile(r'\s+')
        self.paragraph_break_pattern = re.compile(r'\n\s*\n')
    
    def analyze_markdown(self, text: str) -> List[StructuralElement]:
        """
        Analyze Markdown structure in the text.
        
        Args:
            text: Input text with Markdown formatting
            
        Returns:
            List of structural elements found
        """
        elements = []
        
        if not self.config['detect_markdown']:
            return elements
        
        # Find headings
        for match in self.md_heading_pattern.finditer(text):
            level = len(match.group(1))
            content = match.group(2).strip()
            element = StructuralElement(
                type=ElementType.HEADING,
                content=content,
                level=level,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'markdown': True}
            )
            elements.append(element)
        
        # Find code blocks
        for match in self.md_code_block_pattern.finditer(text):
            language = match.group(1) or 'text'
            content = match.group(2)
            element = StructuralElement(
                type=ElementType.CODE_BLOCK,
                content=content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'language': language, 'markdown': True}
            )
            elements.append(element)
        
        # Find inline code
        for match in self.md_inline_code_pattern.finditer(text):
            content = match.group(1)
            element = StructuralElement(
                type=ElementType.INLINE_CODE,
                content=content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'markdown': True}
            )
            elements.append(element)
        
        # Find unordered lists
        for match in self.md_list_pattern.finditer(text):
            indent = len(match.group(1))
            content = match.group(2)
            element = StructuralElement(
                type=ElementType.LIST_ITEM,
                content=content,
                level=indent // 2,  # Approximate nesting level
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'list_type': 'unordered', 'markdown': True}
            )
            elements.append(element)
        
        # Find ordered lists
        for match in self.md_ordered_list_pattern.finditer(text):
            indent = len(match.group(1))
            content = match.group(2)
            element = StructuralElement(
                type=ElementType.LIST_ITEM,
                content=content,
                level=indent // 2,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'list_type': 'ordered', 'markdown': True}
            )
            elements.append(element)
        
        # Find quotes
        for match in self.md_quote_pattern.finditer(text):
            content = match.group(1)
            element = StructuralElement(
                type=ElementType.QUOTE,
                content=content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'markdown': True}
            )
            elements.append(element)
        
        # Find links
        for match in self.md_link_pattern.finditer(text):
            text_content = match.group(1)
            url = match.group(2)
            element = StructuralElement(
                type=ElementType.LINK,
                content=text_content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'url': url, 'markdown': True}
            )
            elements.append(element)
        
        # Find images
        for match in self.md_image_pattern.finditer(text):
            alt_text = match.group(1)
            url = match.group(2)
            element = StructuralElement(
                type=ElementType.IMAGE,
                content=alt_text,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'url': url, 'markdown': True}
            )
            elements.append(element)
        
        return elements
    
    def analyze_html(self, text: str) -> List[StructuralElement]:
        """
        Analyze HTML structure in the text.
        
        Args:
            text: Input text with HTML formatting
            
        Returns:
            List of structural elements found
        """
        elements = []
        
        if not self.config['detect_html']:
            return elements
        
        # Find headings
        for match in self.html_heading_pattern.finditer(text):
            tag = match.group(1)
            level = int(tag[1])  # Extract number from h1, h2, etc.
            content = html.unescape(re.sub(r'<[^>]+>', '', match.group(2))).strip()
            element = StructuralElement(
                type=ElementType.HEADING,
                content=content,
                level=level,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'html': True, 'tag': tag}
            )
            elements.append(element)
        
        # Find paragraphs
        for match in self.html_paragraph_pattern.finditer(text):
            content = html.unescape(re.sub(r'<[^>]+>', '', match.group(1))).strip()
            element = StructuralElement(
                type=ElementType.PARAGRAPH,
                content=content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'html': True}
            )
            elements.append(element)
        
        # Find code blocks
        for match in self.html_pre_pattern.finditer(text):
            content = html.unescape(match.group(1))
            element = StructuralElement(
                type=ElementType.CODE_BLOCK,
                content=content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'html': True}
            )
            elements.append(element)
        
        # Find inline code
        for match in self.html_code_pattern.finditer(text):
            content = html.unescape(match.group(1))
            element = StructuralElement(
                type=ElementType.INLINE_CODE,
                content=content,
                start_pos=match.start(),
                end_pos=match.end(),
                attributes={'html': True}
            )
            elements.append(element)
        
        # Find lists
        for match in self.html_list_pattern.finditer(text):
            list_type = match.group(1).lower()  # ul or ol
            list_content = match.group(2)
            
            # Find list items within this list
            for item_match in self.html_list_item_pattern.finditer(list_content):
                content = html.unescape(re.sub(r'<[^>]+>', '', item_match.group(1))).strip()
                element = StructuralElement(
                    type=ElementType.LIST_ITEM,
                    content=content,
                    start_pos=match.start() + item_match.start(),
                    end_pos=match.start() + item_match.end(),
                    attributes={'list_type': list_type, 'html': True}
                )
                elements.append(element)
        
        return elements
    
    def detect_paragraphs(self, text: str, existing_elements: List[StructuralElement]) -> List[StructuralElement]:
        """
        Detect paragraph breaks in plain text areas.
        
        Args:
            text: Input text
            existing_elements: Already detected structural elements
            
        Returns:
            List of paragraph elements
        """
        paragraphs = []
        
        # Create a mask of positions covered by existing elements
        covered_positions = set()
        for element in existing_elements:
            for pos in range(element.start_pos, element.end_pos):
                covered_positions.add(pos)
        
        # Split text into paragraphs
        paragraph_splits = self.paragraph_break_pattern.split(text)
        current_pos = 0
        
        for paragraph_text in paragraph_splits:
            if paragraph_text.strip():
                paragraph_start = text.find(paragraph_text, current_pos)
                paragraph_end = paragraph_start + len(paragraph_text)
                
                # Check if this paragraph area is mostly uncovered by other elements
                paragraph_positions = set(range(paragraph_start, paragraph_end))
                overlap = len(paragraph_positions.intersection(covered_positions))
                
                if overlap < len(paragraph_positions) * 0.5:  # Less than 50% overlap
                    element = StructuralElement(
                        type=ElementType.PARAGRAPH,
                        content=paragraph_text.strip(),
                        start_pos=paragraph_start,
                        end_pos=paragraph_end,
                        attributes={'detected': True}
                    )
                    paragraphs.append(element)
                
                current_pos = paragraph_end
        
        return paragraphs
    
    def build_hierarchy(self, elements: List[StructuralElement]) -> List[StructuralElement]:
        """
        Build hierarchical structure from flat list of elements.
        
        Args:
            elements: Flat list of structural elements
            
        Returns:
            Hierarchically organized list of elements
        """
        if not self.config['preserve_hierarchy']:
            return elements
        
        # Sort elements by position
        sorted_elements = sorted(elements, key=lambda x: x.start_pos)
        
        # Build hierarchy for headings
        hierarchy = []
        heading_stack = []
        
        for element in sorted_elements:
            if element.type == ElementType.HEADING:
                # Remove headings from stack that are at same or lower level
                while heading_stack and heading_stack[-1].level >= element.level:
                    heading_stack.pop()
                
                # Add to parent's children if there's a parent
                if heading_stack:
                    heading_stack[-1].children.append(element)
                else:
                    hierarchy.append(element)
                
                heading_stack.append(element)
            
            else:
                # Add to current heading's children if there's one
                if heading_stack:
                    heading_stack[-1].children.append(element)
                else:
                    hierarchy.append(element)
        
        return hierarchy
    
    def extract_metadata(self, elements: List[StructuralElement]) -> Dict[str, Any]:
        """
        Extract metadata from the structural elements.
        
        Args:
            elements: List of structural elements
            
        Returns:
            Dictionary containing document metadata
        """
        metadata = {
            'total_elements': len(elements),
            'element_types': {},
            'heading_levels': [],
            'has_code': False,
            'has_lists': False,
            'has_images': False,
            'has_links': False,
            'languages': set(),
            'structure_complexity': 0
        }
        
        for element in elements:
            # Count element types
            element_type = element.type.value
            metadata['element_types'][element_type] = metadata['element_types'].get(element_type, 0) + 1
            
            # Track heading levels
            if element.type == ElementType.HEADING:
                metadata['heading_levels'].append(element.level)
            
            # Track features
            if element.type in [ElementType.CODE_BLOCK, ElementType.INLINE_CODE]:
                metadata['has_code'] = True
                if 'language' in element.attributes:
                    metadata['languages'].add(element.attributes['language'])
            
            if element.type == ElementType.LIST_ITEM:
                metadata['has_lists'] = True
            
            if element.type == ElementType.IMAGE:
                metadata['has_images'] = True
            
            if element.type == ElementType.LINK:
                metadata['has_links'] = True
        
        # Calculate structure complexity
        metadata['structure_complexity'] = (
            len(set(metadata['heading_levels'])) * 2 +
            metadata['element_types'].get('list_item', 0) * 0.5 +
            metadata['element_types'].get('code_block', 0) * 1.5 +
            len(metadata['languages']) * 1.2
        )
        
        metadata['languages'] = list(metadata['languages'])
        return metadata
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Perform comprehensive structural analysis of the text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary containing all structural analysis results
        """
        if not text.strip():
            return {
                'elements': [],
                'hierarchy': [],
                'metadata': self.extract_metadata([]),
                'text_length': 0
            }
        
        # Collect all structural elements
        all_elements = []
        
        # Analyze Markdown
        all_elements.extend(self.analyze_markdown(text))
        
        # Analyze HTML
        all_elements.extend(self.analyze_html(text))
        
        # Detect paragraphs in remaining text
        paragraphs = self.detect_paragraphs(text, all_elements)
        all_elements.extend(paragraphs)
        
        # Remove duplicates and overlapping elements
        all_elements = self._remove_overlapping_elements(all_elements)
        
        # Build hierarchical structure
        hierarchy = self.build_hierarchy(all_elements) if self.config['preserve_hierarchy'] else all_elements
        
        # Extract metadata
        metadata = self.extract_metadata(all_elements)
        
        return {
            'elements': all_elements,
            'hierarchy': hierarchy,
            'metadata': metadata,
            'text_length': len(text)
        }
    
    def _remove_overlapping_elements(self, elements: List[StructuralElement]) -> List[StructuralElement]:
        """
        Remove overlapping elements, keeping the most specific ones.
        
        Args:
            elements: List of potentially overlapping elements
            
        Returns:
            List of non-overlapping elements
        """
        # Sort by start position, then by length (shorter first for more specific)
        sorted_elements = sorted(elements, key=lambda x: (x.start_pos, x.end_pos - x.start_pos))
        
        filtered_elements = []
        for element in sorted_elements:
            # Check if this element overlaps significantly with any already added element
            overlaps = False
            for existing in filtered_elements:
                overlap_start = max(element.start_pos, existing.start_pos)
                overlap_end = min(element.end_pos, existing.end_pos)
                overlap_length = max(0, overlap_end - overlap_start)
                
                element_length = element.end_pos - element.start_pos
                existing_length = existing.end_pos - existing.start_pos
                
                # If overlap is more than 50% of either element, consider it overlapping
                if (overlap_length > element_length * 0.5 or 
                    overlap_length > existing_length * 0.5):
                    overlaps = True
                    break
            
            if not overlaps:
                filtered_elements.append(element)
        
        return filtered_elements


def analyze_document_structure(text: str, config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Convenience function for quick structural analysis.
    
    Args:
        text: Input text to analyze
        config: Optional configuration dictionary
        
    Returns:
        Dictionary containing structural analysis results
    """
    analyzer = StructuralAnalyzer(config)
    return analyzer.analyze(text)


# Example usage and test cases
if __name__ == "__main__":
    # Test cases for structural analysis
    test_cases = [
        """
# Main Heading

This is a paragraph with some text.

## Subheading

- List item 1
- List item 2
  - Nested item

```python
def hello():
    print("Hello, world!")
```

Another paragraph with `inline code` and a [link](http://example.com).

### Another subheading

> This is a blockquote
> with multiple lines.

![Alt text](image.png)
        """,
        """
<h1>HTML Heading</h1>
<p>This is an HTML paragraph.</p>
<ul>
  <li>HTML list item 1</li>
  <li>HTML list item 2</li>
</ul>
<pre><code>HTML code block</code></pre>
        """,
    ]
    
    analyzer = StructuralAnalyzer()
    
    print("Structural Analysis Test Results:")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}:")
        print(f"Input length: {len(test_case)} characters")
        
        result = analyzer.analyze(test_case)
        
        print(f"Elements found: {len(result['elements'])}")
        print(f"Metadata: {result['metadata']}")
        
        print("\nElement types found:")
        for element in result['elements']:
            print(f"  - {element.type.value}: '{element.content[:50]}...' (level {element.level})")

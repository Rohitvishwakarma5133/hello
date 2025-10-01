"""
Comprehensive Unit Tests for Stage 1.1 Preprocessing

This module contains unit tests for all preprocessing components:
- WhitespaceNormalizer
- PunctuationHandler  
- StructuralAnalyzer
- PreprocessingPipeline

The tests cover various edge cases, error conditions, and 
integration scenarios to ensure robust functionality.
"""

import unittest
import sys
import os
from unittest.mock import patch, MagicMock

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from whitespace_normalizer import WhitespaceNormalizer, normalize_whitespace
from punctuation_handler import PunctuationHandler, normalize_punctuation
from structural_analyzer import StructuralAnalyzer, analyze_document_structure, ElementType
from preprocessing_pipeline import PreprocessingPipeline, preprocess_text


class TestWhitespaceNormalizer(unittest.TestCase):
    """Test cases for WhitespaceNormalizer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.normalizer = WhitespaceNormalizer()
    
    def test_normalize_unicode_spaces(self):
        """Test Unicode space normalization."""
        test_cases = [
            ("Text with\u00A0non-breaking spaces", "Text with non-breaking spaces"),
            ("Text with\u2000em spaces", "Text with em spaces"),
            ("Normal text", "Normal text"),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.normalizer.normalize_unicode_spaces(input_text)
                self.assertEqual(result, expected)
    
    def test_normalize_tabs(self):
        """Test tab normalization."""
        test_cases = [
            ("Text\twith\ttabs", "Text    with    tabs"),  # 4 spaces per tab
            ("No tabs here", "No tabs here"),
            ("\t\tDouble tab", "        Double tab"),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.normalizer.normalize_tabs(input_text)
                self.assertEqual(result, expected)
    
    def test_normalize_line_breaks(self):
        """Test line break normalization."""
        test_cases = [
            ("Windows\r\nline breaks", "Windows\nline breaks"),
            ("Mac\rline breaks", "Mac\nline breaks"),
            ("Unix\nline breaks", "Unix\nline breaks"),
            ("Mixed\r\nand\rbreaks", "Mixed\nand\nbreaks"),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.normalizer.normalize_line_breaks(input_text)
                self.assertEqual(result, expected)
    
    def test_normalize_spaces(self):
        """Test multiple space normalization."""
        test_cases = [
            ("Multiple    spaces", "Multiple spaces"),
            ("Text  with   various    spacing", "Text with various spacing"),
            ("Single space", "Single space"),
            ("", ""),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.normalizer.normalize_spaces(input_text)
                self.assertEqual(result, expected)
    
    def test_remove_trailing_spaces(self):
        """Test trailing space removal."""
        test_cases = [
            ("Line with trailing spaces   \nNext line", "Line with trailing spaces\nNext line"),
            ("No trailing spaces\nNext line", "No trailing spaces\nNext line"),
            ("   \n   ", "\n"),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.normalizer.remove_trailing_spaces(input_text)
                self.assertEqual(result, expected)
    
    def test_full_normalization(self):
        """Test complete normalization process."""
        input_text = "Text\twith\u00A0multiple   \r\nissues    "
        result = self.normalizer.normalize(input_text)
        
        # Should not have tabs, Unicode spaces, multiple spaces, or trailing spaces
        self.assertNotIn('\t', result)
        self.assertNotIn('\u00A0', result)
        self.assertNotIn('  ', result)  # No double spaces
        self.assertNotIn('\r', result)
    
    def test_empty_input(self):
        """Test handling of empty input."""
        self.assertEqual(self.normalizer.normalize(""), "")
        self.assertEqual(self.normalizer.normalize(None), None)
    
    def test_custom_config(self):
        """Test custom configuration."""
        config = {
            'tab_to_spaces': 2,
            'max_consecutive_spaces': 2,
            'preserve_paragraph_breaks': False
        }
        normalizer = WhitespaceNormalizer(config)
        
        result = normalizer.normalize("Text\twith  tabs   and    spaces")
        self.assertEqual(result, "Text  with  tabs  and  spaces")


class TestPunctuationHandler(unittest.TestCase):
    """Test cases for PunctuationHandler class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.handler = PunctuationHandler()
    
    def test_fix_extra_punctuation(self):
        """Test extra punctuation fixing."""
        test_cases = [
            ("Hello,,,world!!!", "Hello,world!!!"),
            ("Too many periods....", "Too many periods..."),
            ("Question???", "Question???"),  # Should keep up to 3
            ("Normal punctuation.", "Normal punctuation."),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.handler.fix_extra_punctuation(input_text)
                self.assertEqual(result, expected)
    
    def test_add_missing_spaces(self):
        """Test missing space addition."""
        test_cases = [
            ("Sentence.Next sentence", "Sentence. Next sentence"),
            ("Hello!How are you?", "Hello! How are you?"),
            ("Normal spacing. Already good.", "Normal spacing. Already good."),
            ("Multiple,issues,here.", "Multiple, issues, here."),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.handler.add_missing_spaces(input_text)
                self.assertEqual(result, expected)
    
    def test_standardize_quotes(self):
        """Test quote standardization."""
        test_cases = [
            ('"Hello" world', '"Hello" world'),  # Already standard
            ('"Curly quotes"', '"Curly quotes"'),
            ('«Angle quotes»', '"Angle quotes"'),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.handler.standardize_quotes(input_text)
                self.assertEqual(result, expected)
    
    def test_normalize_apostrophes(self):
        """Test apostrophe normalization."""
        test_cases = [
            ("Don't use fancy apostrophes", "Don't use fancy apostrophes"),
            ("It's a test", "It's a test"),
            ("We`re testing", "We're testing"),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.handler.normalize_apostrophes(input_text)
                self.assertEqual(result, expected)
    
    def test_normalize_ellipses(self):
        """Test ellipsis normalization."""
        test_cases = [
            ("Wait.....", "Wait..."),
            ("Thinking…", "Thinking..."),
            ("Already correct...", "Already correct..."),
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.handler.normalize_ellipses(input_text)
                self.assertEqual(result, expected)
    
    def test_preserve_code_blocks(self):
        """Test code block preservation."""
        input_text = "Text with `code.here()` and ```\nmore code!!!\n```"
        result = self.handler.normalize(input_text)
        
        # Code blocks should be preserved
        self.assertIn('`code.here()`', result)
        self.assertIn('more code!!!', result)
    
    def test_full_normalization(self):
        """Test complete punctuation normalization."""
        input_text = 'Text with,,,issues!!!And"mixed quotes".'
        result = self.handler.normalize(input_text)
        
        # Should fix commas, add space after exclamations
        self.assertNotIn(',,,', result)
        self.assertIn('! And', result)


class TestStructuralAnalyzer(unittest.TestCase):
    """Test cases for StructuralAnalyzer class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = StructuralAnalyzer()
    
    def test_analyze_markdown_headings(self):
        """Test Markdown heading detection."""
        markdown_text = """
# Main Heading
## Sub Heading
### Sub Sub Heading
Regular text here.
"""
        result = self.analyzer.analyze_markdown(markdown_text)
        
        # Should find 3 headings
        headings = [elem for elem in result if elem.type == ElementType.HEADING]
        self.assertEqual(len(headings), 3)
        
        # Check heading levels
        self.assertEqual(headings[0].level, 1)
        self.assertEqual(headings[1].level, 2)
        self.assertEqual(headings[2].level, 3)
    
    def test_analyze_markdown_code_blocks(self):
        """Test Markdown code block detection."""
        markdown_text = """
Text here.

```python
def hello():
    print("Hello")
```

More text with `inline code` here.
"""
        result = self.analyzer.analyze_markdown(markdown_text)
        
        # Should find code block and inline code
        code_blocks = [elem for elem in result if elem.type == ElementType.CODE_BLOCK]
        inline_code = [elem for elem in result if elem.type == ElementType.INLINE_CODE]
        
        self.assertEqual(len(code_blocks), 1)
        self.assertEqual(len(inline_code), 1)
        self.assertEqual(code_blocks[0].attributes['language'], 'python')
    
    def test_analyze_markdown_lists(self):
        """Test Markdown list detection."""
        markdown_text = """
- Item 1
- Item 2
  - Nested item
- Item 3

1. Ordered item 1
2. Ordered item 2
"""
        result = self.analyzer.analyze_markdown(markdown_text)
        
        # Should find list items
        list_items = [elem for elem in result if elem.type == ElementType.LIST_ITEM]
        self.assertGreater(len(list_items), 0)
        
        # Check for different list types
        unordered = [item for item in list_items if item.attributes.get('list_type') == 'unordered']
        ordered = [item for item in list_items if item.attributes.get('list_type') == 'ordered']
        
        self.assertGreater(len(unordered), 0)
        self.assertGreater(len(ordered), 0)
    
    def test_analyze_html(self):
        """Test HTML structure detection."""
        html_text = """
<h1>Main Title</h1>
<p>This is a paragraph.</p>
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
<code>inline code</code>
"""
        result = self.analyzer.analyze_html(html_text)
        
        # Should find various HTML elements
        headings = [elem for elem in result if elem.type == ElementType.HEADING]
        paragraphs = [elem for elem in result if elem.type == ElementType.PARAGRAPH]
        list_items = [elem for elem in result if elem.type == ElementType.LIST_ITEM]
        
        self.assertEqual(len(headings), 1)
        self.assertEqual(len(paragraphs), 1)
        self.assertEqual(len(list_items), 2)
    
    def test_full_analysis(self):
        """Test complete structural analysis."""
        mixed_text = """
# Document Title

This is a paragraph with some text.

```python
print("Hello, world!")
```

- List item 1
- List item 2

Another paragraph here.
"""
        result = self.analyzer.analyze(mixed_text)
        
        # Should have elements and metadata
        self.assertIn('elements', result)
        self.assertIn('metadata', result)
        self.assertIn('hierarchy', result)
        
        self.assertGreater(len(result['elements']), 0)
        self.assertGreater(result['metadata']['total_elements'], 0)
    
    def test_empty_input(self):
        """Test handling of empty input."""
        result = self.analyzer.analyze("")
        
        self.assertEqual(len(result['elements']), 0)
        self.assertEqual(result['metadata']['total_elements'], 0)
    
    def test_metadata_extraction(self):
        """Test metadata extraction."""
        text_with_features = """
# Heading

```python
code here
```

![Image](test.png)
[Link](http://example.com)

- List item
"""
        result = self.analyzer.analyze(text_with_features)
        metadata = result['metadata']
        
        self.assertTrue(metadata['has_code'])
        self.assertTrue(metadata['has_links'])
        self.assertTrue(metadata['has_images'])
        self.assertTrue(metadata['has_lists'])


class TestPreprocessingPipeline(unittest.TestCase):
    """Test cases for PreprocessingPipeline class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.pipeline = PreprocessingPipeline()
    
    def test_initialization(self):
        """Test pipeline initialization."""
        self.assertIsNotNone(self.pipeline.whitespace_normalizer)
        self.assertIsNotNone(self.pipeline.punctuation_handler)
        self.assertIsNotNone(self.pipeline.structural_analyzer)
    
    def test_process_simple_text(self):
        """Test processing simple text."""
        input_text = "Simple    text   with   spacing issues."
        result = self.pipeline.process(input_text)
        
        self.assertTrue(result.success)
        self.assertNotEqual(result.processed_text, result.original_text)
        self.assertNotIn('   ', result.processed_text)  # Multiple spaces should be gone
    
    def test_process_complex_text(self):
        """Test processing complex text with multiple issues."""
        input_text = """
# Test   Document

Text with    multiple   issues,,,here!!!Next sentence.

```python
def test():
    print("hello")
```

- List item   with   issues   
"""
        result = self.pipeline.process(input_text)
        
        self.assertTrue(result.success)
        self.assertEqual(len(result.stats.stages_completed), 3)  # All stages should complete
        self.assertGreater(result.stats.elements_found, 0)
    
    def test_process_empty_text(self):
        """Test processing empty text."""
        result = self.pipeline.process("")
        
        self.assertTrue(result.success)
        self.assertEqual(result.processed_text, "")
        self.assertEqual(len(result.structural_analysis['elements']), 0)
    
    def test_custom_configuration(self):
        """Test pipeline with custom configuration."""
        config = {
            'stages': {
                'whitespace_normalization': True,
                'punctuation_handling': False,  # Disable punctuation handling
                'structural_analysis': True
            },
            'stage_order': ['whitespace_normalization', 'structural_analysis']
        }
        
        pipeline = PreprocessingPipeline(config)
        result = pipeline.process("Text with,,,punctuation issues.")
        
        self.assertTrue(result.success)
        # Punctuation issues should remain since punctuation handling is disabled
        self.assertIn(',,,', result.processed_text)
        # But whitespace should be normalized
        self.assertIn('punctuation_handling', result.stats.stages_skipped)
    
    def test_error_handling(self):
        """Test error handling in pipeline."""
        # Mock a component to raise an exception
        with patch.object(self.pipeline.whitespace_normalizer, 'normalize', side_effect=Exception("Test error")):
            result = self.pipeline.process("Test text")
            
            # Should not stop on error by default
            self.assertTrue(result.success)  # Still succeeds due to error_recovery
            self.assertGreater(len(result.stats.errors), 0)
    
    def test_batch_processing(self):
        """Test batch processing functionality."""
        texts = [
            "First   text   with   issues",
            "Second text,,,with problems!!!",
            "# Third text\nWith structure"
        ]
        
        results = self.pipeline.process_batch(texts)
        
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertTrue(result.success)
    
    def test_pipeline_info(self):
        """Test pipeline information retrieval."""
        info = self.pipeline.get_pipeline_info()
        
        self.assertIn('enabled_stages', info)
        self.assertIn('stage_order', info)
        self.assertIn('error_handling', info)
        self.assertIn('performance', info)
    
    def test_convenience_function(self):
        """Test convenience function."""
        result = preprocess_text("Text   with   issues")
        
        self.assertIsInstance(result, type(self.pipeline.process("test")))
        self.assertTrue(result.success)


class TestIntegration(unittest.TestCase):
    """Integration tests for the complete preprocessing system."""
    
    def test_end_to_end_processing(self):
        """Test end-to-end processing of a complex document."""
        complex_document = """
#   Messy   Document   Title   

This is    a paragraph   with multiple   spacing    issues,,,and punctuation problems!!!Next sentence here.

##   Subheading   

- List item   with  issues   
-    Another item.Missing space here   
  -   Nested item   

```python
def messy_function(   ):
    print(  "Hello,,,world!!!"  )
```

Text with "mixed quotes" and 'other issues'.

> Quote with   spacing problems   .

![Image](test.png)
[Link](http://example.com)

Final paragraph    with    issues   .
"""
        
        pipeline = PreprocessingPipeline()
        result = pipeline.process(complex_document)
        
        # Should successfully process
        self.assertTrue(result.success)
        
        # Should complete all stages
        self.assertEqual(len(result.stats.stages_completed), 3)
        
        # Should find structural elements
        self.assertGreater(result.stats.elements_found, 5)
        
        # Should fix whitespace issues
        self.assertNotIn('   ', result.processed_text)
        
        # Should fix punctuation issues
        self.assertNotIn(',,,', result.processed_text)
        self.assertIn('! Next sentence', result.processed_text)
        
        # Should preserve code blocks properly
        self.assertIn('print(', result.processed_text)
        
        # Should identify various structural elements
        metadata = result.structural_analysis['metadata']
        self.assertTrue(metadata['has_code'])
        self.assertTrue(metadata['has_lists'])
        self.assertTrue(metadata['has_images'])
        self.assertTrue(metadata['has_links'])
        self.assertGreater(len(metadata['heading_levels']), 0)
    
    def test_performance_measurement(self):
        """Test performance measurement capabilities."""
        text = "Test text " * 1000  # Longer text for performance testing
        
        result = preprocess_text(text)
        
        self.assertTrue(result.success)
        self.assertGreater(result.stats.duration_seconds, 0)
        self.assertEqual(result.stats.input_length, len(text))
        self.assertEqual(result.stats.output_length, len(result.processed_text))
    
    def test_configuration_persistence(self):
        """Test configuration saving and loading."""
        import tempfile
        import os
        
        # Create a custom configuration
        custom_config = {
            'stages': {
                'whitespace_normalization': True,
                'punctuation_handling': False,
                'structural_analysis': True
            },
            'whitespace_config': {
                'tab_to_spaces': 2
            }
        }
        
        pipeline = PreprocessingPipeline(custom_config)
        
        # Save configuration to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            pipeline.save_config(temp_file)
            
            # Load configuration and create new pipeline
            loaded_pipeline = PreprocessingPipeline.load_config(temp_file)
            
            # Should have the same configuration
            self.assertEqual(loaded_pipeline.config['stages']['punctuation_handling'], False)
            self.assertEqual(loaded_pipeline.config['whitespace_config']['tab_to_spaces'], 2)
            
        finally:
            # Clean up
            if os.path.exists(temp_file):
                os.unlink(temp_file)


if __name__ == '__main__':
    # Configure logging for tests
    import logging
    logging.basicConfig(level=logging.WARNING)  # Reduce noise during testing
    
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add all test classes
    test_classes = [
        TestWhitespaceNormalizer,
        TestPunctuationHandler,
        TestStructuralAnalyzer,
        TestPreprocessingPipeline,
        TestIntegration
    ]
    
    for test_class in test_classes:
        tests = unittest.TestLoader().loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\nTest Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {(result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100:.1f}%")
"""
Main Pre-processing Pipeline

This module provides a comprehensive pre-processing pipeline that combines
whitespace normalization, punctuation handling, and structural analysis
for intelligent text preprocessing.

Features:
- Unified pipeline with configurable stages
- Error handling and recovery
- Performance monitoring
- Customizable processing order
- Batch processing support
- Detailed processing reports
"""

import time
import logging
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, field
from pathlib import Path
import json

# Import our custom modules
try:
    from .whitespace_normalizer import WhitespaceNormalizer
    from .punctuation_handler import PunctuationHandler
    from .structural_analyzer import StructuralAnalyzer, StructuralElement
except ImportError:
    # For standalone execution
    from whitespace_normalizer import WhitespaceNormalizer
    from punctuation_handler import PunctuationHandler
    from structural_analyzer import StructuralAnalyzer, StructuralElement


@dataclass
class ProcessingStats:
    """Statistics about the preprocessing operation."""
    start_time: float = 0.0
    end_time: float = 0.0
    duration_seconds: float = 0.0
    input_length: int = 0
    output_length: int = 0
    stages_completed: List[str] = field(default_factory=list)
    stages_skipped: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    elements_found: int = 0
    complexity_score: float = 0.0


@dataclass
class ProcessingResult:
    """Complete result of the preprocessing pipeline."""
    processed_text: str
    original_text: str
    structural_analysis: Dict[str, Any]
    stats: ProcessingStats
    success: bool = True
    error_message: Optional[str] = None


class PreprocessingPipeline:
    """
    A comprehensive preprocessing pipeline that orchestrates all
    preprocessing stages in a configurable and robust manner.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the pipeline with configuration options.
        
        Args:
            config: Optional configuration dictionary
        """
        self.config = config or self._default_config()
        self.logger = self._setup_logging()
        
        # Initialize processing components
        self._initialize_components()
        
        # Validate configuration
        self._validate_config()
    
    def _default_config(self) -> Dict[str, Any]:
        """Default configuration for the preprocessing pipeline."""
        return {
            # Pipeline stages
            'stages': {
                'whitespace_normalization': True,
                'punctuation_handling': True,
                'structural_analysis': True
            },
            
            # Processing order
            'stage_order': [
                'whitespace_normalization',
                'punctuation_handling', 
                'structural_analysis'
            ],
            
            # Error handling
            'stop_on_error': False,
            'max_errors': 5,
            'error_recovery': True,
            
            # Performance
            'enable_stats': True,
            'log_level': 'INFO',
            'timeout_seconds': 300,  # 5 minutes max
            
            # Stage-specific configs
            'whitespace_config': {},
            'punctuation_config': {},
            'structural_config': {},
            
            # Output options
            'preserve_original': True,
            'detailed_report': True,
            'include_metadata': True
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Set up logging for the pipeline."""
        logger = logging.getLogger('preprocessing_pipeline')
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        log_level = getattr(logging, self.config['log_level'].upper(), logging.INFO)
        logger.setLevel(log_level)
        
        return logger
    
    def _initialize_components(self):
        """Initialize all processing components."""
        try:
            # Initialize whitespace normalizer
            if self.config['stages']['whitespace_normalization']:
                self.whitespace_normalizer = WhitespaceNormalizer(
                    self.config['whitespace_config']
                )
            
            # Initialize punctuation handler
            if self.config['stages']['punctuation_handling']:
                self.punctuation_handler = PunctuationHandler(
                    self.config['punctuation_config']
                )
            
            # Initialize structural analyzer
            if self.config['stages']['structural_analysis']:
                self.structural_analyzer = StructuralAnalyzer(
                    self.config['structural_config']
                )
            
            self.logger.info("All preprocessing components initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize components: {str(e)}")
            raise
    
    def _validate_config(self):
        """Validate the pipeline configuration."""
        required_keys = ['stages', 'stage_order']
        for key in required_keys:
            if key not in self.config:
                raise ValueError(f"Missing required configuration key: {key}")
        
        # Validate stage order
        for stage in self.config['stage_order']:
            if stage not in self.config['stages']:
                raise ValueError(f"Stage '{stage}' in stage_order not found in stages config")
        
        self.logger.debug("Configuration validation passed")
    
    def _create_stats(self, original_text: str) -> ProcessingStats:
        """Create initial processing statistics."""
        return ProcessingStats(
            start_time=time.time(),
            input_length=len(original_text)
        )
    
    def _update_stats(self, stats: ProcessingStats, processed_text: str, 
                     structural_analysis: Optional[Dict[str, Any]] = None):
        """Update processing statistics."""
        stats.end_time = time.time()
        stats.duration_seconds = stats.end_time - stats.start_time
        stats.output_length = len(processed_text)
        
        if structural_analysis and self.config['stages']['structural_analysis']:
            stats.elements_found = len(structural_analysis.get('elements', []))
            stats.complexity_score = structural_analysis.get('metadata', {}).get('structure_complexity', 0)
    
    def _process_whitespace_normalization(self, text: str, stats: ProcessingStats) -> str:
        """Process whitespace normalization stage."""
        try:
            if not self.config['stages']['whitespace_normalization']:
                stats.stages_skipped.append('whitespace_normalization')
                return text
            
            self.logger.debug("Starting whitespace normalization")
            normalized_text = self.whitespace_normalizer.normalize(text)
            stats.stages_completed.append('whitespace_normalization')
            
            self.logger.debug(f"Whitespace normalization completed. "
                            f"Length change: {len(text)} → {len(normalized_text)}")
            
            return normalized_text
            
        except Exception as e:
            error_msg = f"Whitespace normalization failed: {str(e)}"
            self.logger.error(error_msg)
            stats.errors.append(error_msg)
            
            if self.config['stop_on_error']:
                raise
            
            return text  # Return original text on error
    
    def _process_punctuation_handling(self, text: str, stats: ProcessingStats) -> str:
        """Process punctuation handling stage."""
        try:
            if not self.config['stages']['punctuation_handling']:
                stats.stages_skipped.append('punctuation_handling')
                return text
            
            self.logger.debug("Starting punctuation handling")
            processed_text = self.punctuation_handler.normalize(text)
            stats.stages_completed.append('punctuation_handling')
            
            self.logger.debug(f"Punctuation handling completed. "
                            f"Length change: {len(text)} → {len(processed_text)}")
            
            return processed_text
            
        except Exception as e:
            error_msg = f"Punctuation handling failed: {str(e)}"
            self.logger.error(error_msg)
            stats.errors.append(error_msg)
            
            if self.config['stop_on_error']:
                raise
            
            return text  # Return original text on error
    
    def _process_structural_analysis(self, text: str, stats: ProcessingStats) -> Dict[str, Any]:
        """Process structural analysis stage."""
        try:
            if not self.config['stages']['structural_analysis']:
                stats.stages_skipped.append('structural_analysis')
                return {'elements': [], 'hierarchy': [], 'metadata': {}, 'text_length': len(text)}
            
            self.logger.debug("Starting structural analysis")
            analysis_result = self.structural_analyzer.analyze(text)
            stats.stages_completed.append('structural_analysis')
            
            self.logger.debug(f"Structural analysis completed. "
                            f"Found {len(analysis_result['elements'])} elements")
            
            return analysis_result
            
        except Exception as e:
            error_msg = f"Structural analysis failed: {str(e)}"
            self.logger.error(error_msg)
            stats.errors.append(error_msg)
            
            if self.config['stop_on_error']:
                raise
            
            return {'elements': [], 'hierarchy': [], 'metadata': {}, 'text_length': len(text)}
    
    def process(self, text: str) -> ProcessingResult:
        """
        Process text through the complete preprocessing pipeline.
        
        Args:
            text: Input text to process
            
        Returns:
            ProcessingResult containing processed text and analysis
        """
        if not text:
            return ProcessingResult(
                processed_text="",
                original_text="",
                structural_analysis={'elements': [], 'hierarchy': [], 'metadata': {}, 'text_length': 0},
                stats=ProcessingStats(),
                success=True
            )
        
        # Initialize processing
        stats = self._create_stats(text)
        original_text = text
        processed_text = text
        structural_analysis = {}
        
        try:
            self.logger.info(f"Starting preprocessing pipeline for text of length {len(text)}")
            
            # Process stages in configured order
            for stage_name in self.config['stage_order']:
                if len(stats.errors) >= self.config['max_errors']:
                    self.logger.error("Maximum error count reached, stopping pipeline")
                    break
                
                if stage_name == 'whitespace_normalization':
                    processed_text = self._process_whitespace_normalization(processed_text, stats)
                
                elif stage_name == 'punctuation_handling':
                    processed_text = self._process_punctuation_handling(processed_text, stats)
                
                elif stage_name == 'structural_analysis':
                    structural_analysis = self._process_structural_analysis(processed_text, stats)
                
                else:
                    warning_msg = f"Unknown stage: {stage_name}"
                    self.logger.warning(warning_msg)
                    stats.warnings.append(warning_msg)
            
            # Update final statistics
            self._update_stats(stats, processed_text, structural_analysis)
            
            success = len(stats.errors) == 0 or not self.config['stop_on_error']
            
            self.logger.info(f"Pipeline completed. Success: {success}, "
                           f"Duration: {stats.duration_seconds:.3f}s, "
                           f"Stages completed: {len(stats.stages_completed)}")
            
            return ProcessingResult(
                processed_text=processed_text,
                original_text=original_text,
                structural_analysis=structural_analysis,
                stats=stats,
                success=success,
                error_message=None if success else "; ".join(stats.errors)
            )
            
        except Exception as e:
            error_message = f"Pipeline failed with error: {str(e)}"
            self.logger.error(error_message)
            stats.errors.append(error_message)
            self._update_stats(stats, processed_text, structural_analysis)
            
            return ProcessingResult(
                processed_text=original_text if self.config['error_recovery'] else "",
                original_text=original_text,
                structural_analysis=structural_analysis or {},
                stats=stats,
                success=False,
                error_message=error_message
            )
    
    def process_batch(self, texts: List[str]) -> List[ProcessingResult]:
        """
        Process multiple texts in batch.
        
        Args:
            texts: List of input texts to process
            
        Returns:
            List of ProcessingResults
        """
        results = []
        
        self.logger.info(f"Starting batch processing of {len(texts)} texts")
        
        for i, text in enumerate(texts):
            try:
                self.logger.debug(f"Processing batch item {i + 1}/{len(texts)}")
                result = self.process(text)
                results.append(result)
                
            except Exception as e:
                self.logger.error(f"Batch item {i + 1} failed: {str(e)}")
                results.append(ProcessingResult(
                    processed_text=text if self.config['error_recovery'] else "",
                    original_text=text,
                    structural_analysis={},
                    stats=ProcessingStats(),
                    success=False,
                    error_message=str(e)
                ))
        
        self.logger.info(f"Batch processing completed. "
                        f"Success rate: {sum(1 for r in results if r.success) / len(results) * 100:.1f}%")
        
        return results
    
    def get_pipeline_info(self) -> Dict[str, Any]:
        """
        Get information about the current pipeline configuration.
        
        Returns:
            Dictionary with pipeline information
        """
        return {
            'enabled_stages': [stage for stage, enabled in self.config['stages'].items() if enabled],
            'stage_order': self.config['stage_order'],
            'error_handling': {
                'stop_on_error': self.config['stop_on_error'],
                'max_errors': self.config['max_errors'],
                'error_recovery': self.config['error_recovery']
            },
            'performance': {
                'timeout_seconds': self.config['timeout_seconds'],
                'enable_stats': self.config['enable_stats']
            }
        }
    
    def save_config(self, filepath: Union[str, Path]):
        """
        Save current configuration to a JSON file.
        
        Args:
            filepath: Path to save the configuration file
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Configuration saved to {filepath}")
    
    @classmethod
    def load_config(cls, filepath: Union[str, Path]) -> 'PreprocessingPipeline':
        """
        Load configuration from a JSON file and create pipeline.
        
        Args:
            filepath: Path to the configuration file
            
        Returns:
            PreprocessingPipeline instance with loaded configuration
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        return cls(config)


def preprocess_text(text: str, config: Optional[Dict[str, Any]] = None) -> ProcessingResult:
    """
    Convenience function for quick text preprocessing.
    
    Args:
        text: Input text to preprocess
        config: Optional configuration dictionary
        
    Returns:
        ProcessingResult containing processed text and analysis
    """
    pipeline = PreprocessingPipeline(config)
    return pipeline.process(text)


# Example usage and test cases
if __name__ == "__main__":
    # Test cases for the preprocessing pipeline
    test_cases = [
        """
# Sample   Document

This is a    test document with   multiple    issues.

##  Subheading

- List item with,,,extra punctuation!!!
-    Another item.Next sentence here.

```python
def example():
    print("Hello world")
```

Text with "mixed quotes" and 'other issues'.

> Quote with   spacing problems    .

![Image](test.png)
        """,
        """
<h1>HTML Document</h1>
<p>This has   HTML formatting    with issues.</p>
<ul>
  <li>Item 1   .</li>
  <li>Item 2,,,with problems!!!</li>
</ul>
<pre><code>Code here</code></pre>
        """,
        "Simple text without    much structure but   with spacing issues.",
    ]
    
    # Test with default configuration
    pipeline = PreprocessingPipeline()
    
    print("Preprocessing Pipeline Test Results:")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'='*20} Test Case {i} {'='*20}")
        print(f"Input length: {len(test_case)} characters")
        
        result = pipeline.process(test_case)
        
        print(f"Success: {result.success}")
        print(f"Processing time: {result.stats.duration_seconds:.3f} seconds")
        print(f"Output length: {len(result.processed_text)} characters")
        print(f"Stages completed: {result.stats.stages_completed}")
        
        if result.stats.errors:
            print(f"Errors: {result.stats.errors}")
        
        print(f"Elements found: {result.stats.elements_found}")
        print(f"Complexity score: {result.stats.complexity_score:.2f}")
        
        print(f"\nOriginal text preview: {repr(test_case[:100])}...")
        print(f"Processed text preview: {repr(result.processed_text[:100])}...")
    
    # Test batch processing
    print(f"\n{'='*20} Batch Processing Test {'='*20}")
    batch_results = pipeline.process_batch(test_cases)
    success_count = sum(1 for r in batch_results if r.success)
    print(f"Batch success rate: {success_count}/{len(batch_results)} ({success_count/len(batch_results)*100:.1f}%)")
    
    # Show pipeline info
    print(f"\n{'='*20} Pipeline Information {'='*20}")
    pipeline_info = pipeline.get_pipeline_info()
    for key, value in pipeline_info.items():
        print(f"{key}: {value}")
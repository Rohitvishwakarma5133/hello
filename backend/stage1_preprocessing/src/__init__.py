"""
Stage 1.1: Intelligent Pre-processing and Semantic Text Chunking

This module provides comprehensive text preprocessing capabilities including:
- Whitespace normalization
- Punctuation handling  
- Structural analysis
- Document hierarchy extraction

Main Components:
- WhitespaceNormalizer: Standardizes whitespace characters
- PunctuationHandler: Fixes punctuation errors and inconsistencies
- StructuralAnalyzer: Detects document structure and metadata
- PreprocessingPipeline: Orchestrates all processing stages

Quick Start:
    from preprocessing_pipeline import preprocess_text
    
    result = preprocess_text("Your text with   issues,,,here!")
    print(f"Processed: {result.processed_text}")
"""

from .whitespace_normalizer import WhitespaceNormalizer, normalize_whitespace
from .punctuation_handler import PunctuationHandler, normalize_punctuation
from .structural_analyzer import (
    StructuralAnalyzer, 
    analyze_document_structure,
    ElementType,
    StructuralElement
)
from .preprocessing_pipeline import (
    PreprocessingPipeline,
    preprocess_text,
    ProcessingResult,
    ProcessingStats
)

__version__ = "1.1.0"
__author__ = "AI Text Humanizer Team"
__description__ = "Intelligent Pre-processing and Semantic Text Chunking"

# Expose main classes and functions at module level
__all__ = [
    # Main pipeline
    'PreprocessingPipeline',
    'preprocess_text',
    
    # Individual components
    'WhitespaceNormalizer',
    'PunctuationHandler', 
    'StructuralAnalyzer',
    
    # Convenience functions
    'normalize_whitespace',
    'normalize_punctuation',
    'analyze_document_structure',
    
    # Data classes
    'ProcessingResult',
    'ProcessingStats',
    'StructuralElement',
    'ElementType',
    
    # Version info
    '__version__',
]

def get_version():
    """Get the current version of the preprocessing module."""
    return __version__

def get_info():
    """Get module information."""
    return {
        'name': 'Stage 1.1 Preprocessing',
        'version': __version__,
        'description': __description__,
        'author': __author__,
        'components': [
            'WhitespaceNormalizer',
            'PunctuationHandler',
            'StructuralAnalyzer', 
            'PreprocessingPipeline'
        ]
    }
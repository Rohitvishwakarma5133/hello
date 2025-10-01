"""
Perplexity-based AI Detector using GPT-2 model.

This detector calculates perplexity and burstiness metrics to identify
AI-generated text based on statistical patterns in language modeling.
"""

import time
import math
import statistics
from typing import Dict, Any, Optional, List
import torch
import numpy as np
from transformers import GPT2LMHeadModel, GPT2TokenizerFast
import nltk
from nltk.tokenize import sent_tokenize

from ..services.detector_service import BaseDetector, DetectionScore, DetectionResult, DetectionConfidence
from ..utils.logging import setup_logging


class PerplexityDetector(BaseDetector):
    """
    Perplexity-based AI detection using GPT-2.
    
    This detector implements the classic approach of using perplexity and
    burstiness metrics to identify AI-generated text. Lower perplexity often
    indicates AI-generated content, while burstiness measures variation in
    sentence length and complexity.
    """
    
    def __init__(self, model_name: str = "gpt2"):
        """
        Initialize the perplexity detector.
        
        Args:
            model_name: HuggingFace model name for perplexity calculation
        """
        super().__init__("perplexity", "statistical")
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Thresholds (can be tuned based on empirical data)
        self.perplexity_threshold_low = 50   # Below this = likely AI
        self.perplexity_threshold_high = 200  # Above this = likely human
        self.burstiness_threshold_low = 0.3   # Below this = likely AI
        self.burstiness_threshold_high = 0.7  # Above this = likely human
    
    async def initialize(self) -> bool:
        """Initialize the GPT-2 model and tokenizer."""
        try:
            self.logger.info(f"Loading {self.model_name} model for perplexity calculation")
            
            # Load tokenizer
            self.tokenizer = GPT2TokenizerFast.from_pretrained(self.model_name)
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load model
            self.model = GPT2LMHeadModel.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            
            # Download NLTK data if needed
            try:
                nltk.data.find('tokenizers/punkt')
            except LookupError:
                self.logger.info("Downloading NLTK punkt tokenizer")
                nltk.download('punkt', quiet=True)
            
            self._initialized = True
            self.logger.info(f"Perplexity detector initialized with {self.model_name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize perplexity detector: {e}")
            return False
    
    async def detect(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> DetectionScore:
        """
        Detect AI-generated text using perplexity and burstiness analysis.
        
        Args:
            text: Text to analyze
            metadata: Optional metadata
            
        Returns:
            DetectionScore: Detection result with perplexity metrics
        """
        start_time = time.time()
        
        try:
            if not self._initialized:
                raise RuntimeError("Detector not initialized")
            
            if len(text.strip()) < 50:
                # Text too short for reliable analysis
                return DetectionScore(
                    detector_name=self.name,
                    detector_type=self.detector_type,
                    ai_probability=0.5,
                    confidence=DetectionConfidence.VERY_LOW,
                    result=DetectionResult.UNCERTAIN,
                    processing_time_ms=(time.time() - start_time) * 1000,
                    metadata={"error": "Text too short for analysis"},
                    error="Text too short for reliable perplexity analysis"
                )
            
            # Calculate perplexity
            perplexity = await self._calculate_perplexity(text)
            
            # Calculate burstiness
            burstiness = await self._calculate_burstiness(text)
            
            # Calculate AI probability based on metrics
            ai_probability = self._calculate_ai_probability(perplexity, burstiness)
            
            # Classify result
            result, confidence = self._classify_probability(ai_probability)
            
            processing_time = (time.time() - start_time) * 1000
            
            return DetectionScore(
                detector_name=self.name,
                detector_type=self.detector_type,
                ai_probability=ai_probability,
                confidence=confidence,
                result=result,
                processing_time_ms=processing_time,
                metadata={
                    "perplexity": perplexity,
                    "burstiness": burstiness,
                    "perplexity_threshold_low": self.perplexity_threshold_low,
                    "perplexity_threshold_high": self.perplexity_threshold_high,
                    "burstiness_threshold_low": self.burstiness_threshold_low,
                    "burstiness_threshold_high": self.burstiness_threshold_high,
                    "text_length": len(text),
                    "model_used": self.model_name
                }
            )
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            self.logger.error(f"Error in perplexity detection: {e}")
            
            return DetectionScore(
                detector_name=self.name,
                detector_type=self.detector_type,
                ai_probability=0.5,
                confidence=DetectionConfidence.VERY_LOW,
                result=DetectionResult.UNCERTAIN,
                processing_time_ms=processing_time,
                metadata={},
                error=str(e)
            )
    
    async def _calculate_perplexity(self, text: str) -> float:
        """
        Calculate perplexity of text using the loaded GPT-2 model.
        
        Args:
            text: Input text
            
        Returns:
            float: Perplexity score
        """
        try:
            # Tokenize text
            encodings = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=1024)
            input_ids = encodings.input_ids.to(self.device)
            
            with torch.no_grad():
                # Get model outputs
                outputs = self.model(input_ids, labels=input_ids)
                loss = outputs.loss
                
                # Calculate perplexity from loss
                perplexity = math.exp(loss.item())
                
                # Cap extremely high perplexity values
                perplexity = min(perplexity, 10000)
                
                return perplexity
                
        except Exception as e:
            self.logger.warning(f"Error calculating perplexity: {e}")
            return 100.0  # Default neutral value
    
    async def _calculate_burstiness(self, text: str) -> float:
        """
        Calculate burstiness metric based on sentence length variation.
        
        Burstiness measures the variation in sentence lengths. AI text
        tends to have more uniform sentence lengths (low burstiness).
        
        Args:
            text: Input text
            
        Returns:
            float: Burstiness score (0-1, higher = more human-like)
        """
        try:
            # Split into sentences
            sentences = sent_tokenize(text)
            
            if len(sentences) < 3:
                # Need at least 3 sentences for meaningful burstiness
                return 0.5  # Neutral
            
            # Calculate sentence lengths (in words)
            sentence_lengths = []
            for sentence in sentences:
                words = sentence.split()
                sentence_lengths.append(len(words))
            
            if not sentence_lengths:
                return 0.5
            
            # Calculate coefficient of variation (CV) as burstiness measure
            mean_length = statistics.mean(sentence_lengths)
            if mean_length == 0:
                return 0.5
            
            stdev_length = statistics.stdev(sentence_lengths) if len(sentence_lengths) > 1 else 0
            cv = stdev_length / mean_length
            
            # Normalize CV to 0-1 range (empirically determined bounds)
            # Higher CV = more bursty = more human-like
            normalized_burstiness = min(cv / 1.0, 1.0)  # Cap at 1.0
            
            return normalized_burstiness
            
        except Exception as e:
            self.logger.warning(f"Error calculating burstiness: {e}")
            return 0.5  # Default neutral value
    
    def _calculate_ai_probability(self, perplexity: float, burstiness: float) -> float:
        """
        Calculate AI probability based on perplexity and burstiness metrics.
        
        Args:
            perplexity: Perplexity score
            burstiness: Burstiness score
            
        Returns:
            float: AI probability (0-1)
        """
        # Perplexity component (lower = more AI-like)
        if perplexity <= self.perplexity_threshold_low:
            perplexity_score = 0.8  # High AI probability
        elif perplexity >= self.perplexity_threshold_high:
            perplexity_score = 0.2  # Low AI probability
        else:
            # Linear interpolation between thresholds
            range_size = self.perplexity_threshold_high - self.perplexity_threshold_low
            position = (perplexity - self.perplexity_threshold_low) / range_size
            perplexity_score = 0.8 - (position * 0.6)  # 0.8 -> 0.2
        
        # Burstiness component (lower = more AI-like)
        if burstiness <= self.burstiness_threshold_low:
            burstiness_score = 0.7  # High AI probability
        elif burstiness >= self.burstiness_threshold_high:
            burstiness_score = 0.3  # Low AI probability
        else:
            # Linear interpolation between thresholds
            range_size = self.burstiness_threshold_high - self.burstiness_threshold_low
            position = (burstiness - self.burstiness_threshold_low) / range_size
            burstiness_score = 0.7 - (position * 0.4)  # 0.7 -> 0.3
        
        # Weight the components (perplexity is generally more reliable)
        perplexity_weight = 0.7
        burstiness_weight = 0.3
        
        final_probability = (perplexity_score * perplexity_weight + 
                           burstiness_score * burstiness_weight)
        
        # Ensure probability is in valid range
        return max(0.0, min(1.0, final_probability))
    
    async def health_check(self) -> bool:
        """Check if the detector is healthy and ready."""
        try:
            if not self._initialized:
                return False
            
            # Test with a small sample
            test_text = "This is a simple test sentence for health checking."
            perplexity = await self._calculate_perplexity(test_text)
            burstiness = await self._calculate_burstiness(test_text)
            
            # Check if we got reasonable values
            return 0 < perplexity < 10000 and 0 <= burstiness <= 1
            
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        return {
            "model_name": self.model_name,
            "device": str(self.device),
            "initialized": self._initialized,
            "perplexity_thresholds": {
                "low": self.perplexity_threshold_low,
                "high": self.perplexity_threshold_high
            },
            "burstiness_thresholds": {
                "low": self.burstiness_threshold_low,
                "high": self.burstiness_threshold_high
            }
        }
    
    async def batch_analyze(self, texts: List[str]) -> List[Dict[str, float]]:
        """
        Analyze multiple texts for perplexity and burstiness.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of analysis results
        """
        results = []
        
        for text in texts:
            try:
                perplexity = await self._calculate_perplexity(text)
                burstiness = await self._calculate_burstiness(text)
                ai_probability = self._calculate_ai_probability(perplexity, burstiness)
                
                results.append({
                    "perplexity": perplexity,
                    "burstiness": burstiness,
                    "ai_probability": ai_probability,
                    "text_length": len(text)
                })
                
            except Exception as e:
                self.logger.error(f"Error in batch analysis: {e}")
                results.append({
                    "perplexity": 0.0,
                    "burstiness": 0.0,
                    "ai_probability": 0.5,
                    "error": str(e)
                })
        
        return results
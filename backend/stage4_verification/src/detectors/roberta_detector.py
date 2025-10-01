"""
RoBERTa-based AI Detector using pre-trained transformer classifiers.

This detector uses RoBERTa models trained specifically for AI text detection,
such as the roberta-base-openai-detector model available on Hugging Face.
"""

import time
from typing import Dict, Any, Optional, List
import torch
import numpy as np
from transformers import (
    RobertaTokenizer, 
    RobertaForSequenceClassification,
    AutoTokenizer,
    AutoModelForSequenceClassification,
    pipeline
)

from ..services.detector_service import BaseDetector, DetectionScore, DetectionResult, DetectionConfidence
from ..utils.logging import setup_logging


class RoBERTaDetector(BaseDetector):
    """
    RoBERTa-based AI detection using pre-trained classifiers.
    
    This detector uses transformer models that have been fine-tuned
    specifically for distinguishing between human-written and AI-generated text.
    """
    
    def __init__(self, model_name: str = "roberta-base-openai-detector"):
        """
        Initialize the RoBERTa detector.
        
        Args:
            model_name: HuggingFace model name for classification
        """
        super().__init__("roberta", "transformer")
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.classifier = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.max_length = 512  # RoBERTa max sequence length
    
    async def initialize(self) -> bool:
        """Initialize the RoBERTa model and tokenizer."""
        try:
            self.logger.info(f"Loading {self.model_name} model for AI detection")
            
            # Try to load as a pipeline first (easier and handles preprocessing)
            try:
                self.classifier = pipeline(
                    "text-classification",
                    model=self.model_name,
                    tokenizer=self.model_name,
                    device=0 if torch.cuda.is_available() else -1,
                    return_all_scores=True,
                    truncation=True,
                    max_length=self.max_length
                )
                self.logger.info(f"RoBERTa detector initialized with pipeline: {self.model_name}")
                
            except Exception as pipeline_error:
                self.logger.warning(f"Pipeline initialization failed: {pipeline_error}")
                self.logger.info("Falling back to manual model loading")
                
                # Fallback to manual loading
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
                self.model.to(self.device)
                self.model.eval()
                
                self.logger.info(f"RoBERTa detector initialized manually: {self.model_name}")
            
            self._initialized = True
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize RoBERTa detector: {e}")
            return False
    
    async def detect(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> DetectionScore:
        """
        Detect AI-generated text using RoBERTa classifier.
        
        Args:
            text: Text to analyze
            metadata: Optional metadata
            
        Returns:
            DetectionScore: Detection result with classification scores
        """
        start_time = time.time()
        
        try:
            if not self._initialized:
                raise RuntimeError("Detector not initialized")
            
            if len(text.strip()) < 20:
                # Text too short for reliable classification
                return DetectionScore(
                    detector_name=self.name,
                    detector_type=self.detector_type,
                    ai_probability=0.5,
                    confidence=DetectionConfidence.VERY_LOW,
                    result=DetectionResult.UNCERTAIN,
                    processing_time_ms=(time.time() - start_time) * 1000,
                    metadata={"error": "Text too short for classification"},
                    error="Text too short for reliable RoBERTa classification"
                )
            
            # Truncate text if too long
            if len(text) > 2000:  # Conservative limit for processing
                text = text[:2000]
            
            # Get prediction
            if self.classifier:
                # Use pipeline
                ai_probability, classification_scores = await self._classify_with_pipeline(text)
            else:
                # Use manual approach
                ai_probability, classification_scores = await self._classify_manually(text)
            
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
                    "model_name": self.model_name,
                    "text_length": len(text),
                    "classification_scores": classification_scores,
                    "device": str(self.device),
                    "truncated": len(text) >= 2000
                }
            )
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            self.logger.error(f"Error in RoBERTa detection: {e}")
            
            return DetectionScore(
                detector_name=self.name,
                detector_type=self.detector_type,
                ai_probability=0.5,
                confidence=DetectionConfidence.VERY_LOW,
                result=DetectionResult.UNCERTAIN,
                processing_time_ms=processing_time,
                metadata={"model_name": self.model_name},
                error=str(e)
            )
    
    async def _classify_with_pipeline(self, text: str) -> tuple[float, Dict[str, float]]:
        """
        Classify text using the HuggingFace pipeline.
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (ai_probability, classification_scores)
        """
        try:
            # Get predictions
            results = self.classifier(text)
            
            # Extract scores
            scores = {}
            ai_probability = 0.5  # Default
            
            if isinstance(results, list) and len(results) > 0:
                # Multiple scores returned
                for score_dict in results:
                    label = score_dict['label'].lower()
                    score = score_dict['score']
                    scores[label] = score
                    
                    # Map labels to AI probability
                    if 'ai' in label or 'generated' in label or 'fake' in label:
                        ai_probability = score
                    elif 'human' in label or 'real' in label:
                        ai_probability = 1.0 - score
            
            elif isinstance(results, dict):
                # Single prediction
                label = results.get('label', '').lower()
                score = results.get('score', 0.5)
                scores[label] = score
                
                if 'ai' in label or 'generated' in label:
                    ai_probability = score
                elif 'human' in label:
                    ai_probability = 1.0 - score
            
            return ai_probability, scores
            
        except Exception as e:
            self.logger.warning(f"Pipeline classification error: {e}")
            return 0.5, {"error": str(e)}
    
    async def _classify_manually(self, text: str) -> tuple[float, Dict[str, float]]:
        """
        Classify text using manual tokenization and model inference.
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (ai_probability, classification_scores)
        """
        try:
            # Tokenize
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_length,
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                
                # Apply softmax to get probabilities
                probabilities = torch.nn.functional.softmax(logits, dim=-1)
                probs_list = probabilities.cpu().numpy()[0].tolist()
            
            # Map to labels (assuming binary classification)
            if len(probs_list) == 2:
                # Binary: [human, ai] or [real, fake]
                human_prob = probs_list[0]
                ai_prob = probs_list[1]
                
                classification_scores = {
                    "human": human_prob,
                    "ai_generated": ai_prob
                }
                
                ai_probability = ai_prob
                
            else:
                # Multi-class or unknown structure
                ai_probability = max(probs_list)  # Take highest confidence
                classification_scores = {
                    f"class_{i}": prob for i, prob in enumerate(probs_list)
                }
            
            return ai_probability, classification_scores
            
        except Exception as e:
            self.logger.warning(f"Manual classification error: {e}")
            return 0.5, {"error": str(e)}
    
    async def health_check(self) -> bool:
        """Check if the detector is healthy and ready."""
        try:
            if not self._initialized:
                return False
            
            # Test with a simple sample
            test_text = "This is a simple test sentence for health checking the RoBERTa detector."
            
            if self.classifier:
                result = self.classifier(test_text)
                return result is not None
            else:
                # Test manual approach
                inputs = self.tokenizer(
                    test_text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=self.max_length
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    return outputs.logits is not None
            
        except Exception as e:
            self.logger.error(f"RoBERTa health check failed: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        info = {
            "model_name": self.model_name,
            "device": str(self.device),
            "initialized": self._initialized,
            "max_length": self.max_length,
            "uses_pipeline": self.classifier is not None
        }
        
        if self.model:
            info["model_config"] = {
                "num_labels": getattr(self.model.config, 'num_labels', 'unknown'),
                "hidden_size": getattr(self.model.config, 'hidden_size', 'unknown')
            }
        
        return info
    
    async def batch_detect(self, texts: List[str]) -> List[DetectionScore]:
        """
        Detect AI-generated content in multiple texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of DetectionScore results
        """
        results = []
        
        for i, text in enumerate(texts):
            try:
                score = await self.detect(text, metadata={"batch_index": i})
                results.append(score)
            except Exception as e:
                self.logger.error(f"Batch detection error for text {i}: {e}")
                results.append(DetectionScore(
                    detector_name=self.name,
                    detector_type=self.detector_type,
                    ai_probability=0.5,
                    confidence=DetectionConfidence.VERY_LOW,
                    result=DetectionResult.UNCERTAIN,
                    processing_time_ms=0,
                    metadata={"batch_index": i},
                    error=str(e)
                ))
        
        return results


class MultiRoBERTaDetector(BaseDetector):
    """
    Multi-model RoBERTa detector that ensembles multiple RoBERTa-based models.
    """
    
    def __init__(self, model_names: List[str] = None):
        """
        Initialize multi-RoBERTa detector.
        
        Args:
            model_names: List of model names to ensemble
        """
        super().__init__("multi_roberta", "transformer_ensemble")
        
        # Default models if none provided
        self.model_names = model_names or [
            "roberta-base-openai-detector",
            # Add more models as they become available
        ]
        
        self.detectors: List[RoBERTaDetector] = []
    
    async def initialize(self) -> bool:
        """Initialize all RoBERTa detectors."""
        try:
            self.logger.info(f"Initializing multi-RoBERTa detector with {len(self.model_names)} models")
            
            for model_name in self.model_names:
                try:
                    detector = RoBERTaDetector(model_name)
                    if await detector.initialize():
                        self.detectors.append(detector)
                        self.logger.info(f"Successfully loaded {model_name}")
                    else:
                        self.logger.warning(f"Failed to load {model_name}")
                        
                except Exception as e:
                    self.logger.error(f"Error loading {model_name}: {e}")
            
            if len(self.detectors) == 0:
                self.logger.error("No RoBERTa models loaded successfully")
                return False
            
            self._initialized = True
            self.logger.info(f"Multi-RoBERTa detector initialized with {len(self.detectors)} models")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize multi-RoBERTa detector: {e}")
            return False
    
    async def detect(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> DetectionScore:
        """
        Detect AI-generated text using ensemble of RoBERTa models.
        
        Args:
            text: Text to analyze
            metadata: Optional metadata
            
        Returns:
            DetectionScore: Ensemble detection result
        """
        start_time = time.time()
        
        try:
            if not self._initialized:
                raise RuntimeError("Multi-detector not initialized")
            
            if not self.detectors:
                raise RuntimeError("No detectors available")
            
            # Get predictions from all detectors
            detector_results = []
            for detector in self.detectors:
                try:
                    result = await detector.detect(text, metadata)
                    if result.error is None:
                        detector_results.append(result)
                except Exception as e:
                    self.logger.warning(f"Detector {detector.model_name} failed: {e}")
            
            if not detector_results:
                raise RuntimeError("All detectors failed")
            
            # Ensemble the results
            ai_probabilities = [r.ai_probability for r in detector_results]
            avg_ai_probability = sum(ai_probabilities) / len(ai_probabilities)
            
            # Calculate ensemble confidence based on agreement
            variance = sum((p - avg_ai_probability) ** 2 for p in ai_probabilities) / len(ai_probabilities)
            
            if variance < 0.01:
                ensemble_confidence = DetectionConfidence.VERY_HIGH
            elif variance < 0.05:
                ensemble_confidence = DetectionConfidence.HIGH
            elif variance < 0.1:
                ensemble_confidence = DetectionConfidence.MEDIUM
            else:
                ensemble_confidence = DetectionConfidence.LOW
            
            # Classify result
            result, _ = self._classify_probability(avg_ai_probability)
            
            processing_time = (time.time() - start_time) * 1000
            
            return DetectionScore(
                detector_name=self.name,
                detector_type=self.detector_type,
                ai_probability=avg_ai_probability,
                confidence=ensemble_confidence,
                result=result,
                processing_time_ms=processing_time,
                metadata={
                    "ensemble_size": len(detector_results),
                    "individual_scores": [r.ai_probability for r in detector_results],
                    "model_names": [d.model_name for d in self.detectors],
                    "variance": variance,
                    "text_length": len(text)
                }
            )
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            self.logger.error(f"Error in multi-RoBERTa detection: {e}")
            
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
    
    async def health_check(self) -> bool:
        """Check if the ensemble detector is healthy."""
        try:
            if not self._initialized or not self.detectors:
                return False
            
            # Check if at least one detector is healthy
            healthy_count = 0
            for detector in self.detectors:
                if await detector.health_check():
                    healthy_count += 1
            
            # Need at least 50% of detectors healthy
            return healthy_count >= len(self.detectors) // 2
            
        except Exception as e:
            self.logger.error(f"Multi-RoBERTa health check failed: {e}")
            return False
"""
AI Detector Service Framework for Stage 4 - Verification System.

This module provides a modular framework for AI detection that supports
multiple detection methods including perplexity analysis, transformer-based
classifiers, and commercial API integrations.
"""

import asyncio
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Import detection modules (to be implemented)
from ..detectors.perplexity_detector import PerplexityDetector
from ..detectors.roberta_detector import RoBERTaDetector
from ..detectors.commercial_detectors import CommercialAPIDetector
from ..utils.logging import setup_logging


class DetectionConfidence(Enum):
    """Confidence levels for AI detection results."""
    VERY_LOW = "very_low"      # 0-20% confidence
    LOW = "low"                # 20-40% confidence
    MEDIUM = "medium"          # 40-60% confidence
    HIGH = "high"              # 60-80% confidence
    VERY_HIGH = "very_high"    # 80-100% confidence


class DetectionResult(Enum):
    """AI detection results."""
    HUMAN = "human"            # Classified as human-written
    AI_GENERATED = "ai_generated"  # Classified as AI-generated
    UNCERTAIN = "uncertain"    # Unable to classify confidently


@dataclass
class DetectionScore:
    """Individual detector result."""
    detector_name: str
    detector_type: str  # 'perplexity', 'transformer', 'commercial'
    ai_probability: float  # 0.0 to 1.0, probability of being AI-generated
    confidence: DetectionConfidence
    result: DetectionResult
    processing_time_ms: float
    metadata: Dict[str, Any]
    error: Optional[str] = None


@dataclass
class VerificationReport:
    """Comprehensive verification report."""
    text_id: str
    text_sample: str  # First 100 chars for reference
    overall_result: DetectionResult
    overall_confidence: DetectionConfidence
    ai_probability_avg: float
    processing_time_total_ms: float
    detector_scores: List[DetectionScore]
    recommendations: List[str]
    metadata: Dict[str, Any]
    timestamp: float


class BaseDetector(ABC):
    """Abstract base class for AI detectors."""
    
    def __init__(self, name: str, detector_type: str):
        self.name = name
        self.detector_type = detector_type
        self.logger = setup_logging(f"detector.{name}")
        self._initialized = False
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize the detector (load models, etc.)."""
        pass
    
    @abstractmethod
    async def detect(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> DetectionScore:
        """Detect if text is AI-generated."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if detector is healthy and ready."""
        pass
    
    def _classify_probability(self, ai_probability: float) -> Tuple[DetectionResult, DetectionConfidence]:
        """Classify AI probability into result and confidence."""
        if ai_probability < 0.3:
            return DetectionResult.HUMAN, self._get_confidence(1 - ai_probability)
        elif ai_probability > 0.7:
            return DetectionResult.AI_GENERATED, self._get_confidence(ai_probability)
        else:
            return DetectionResult.UNCERTAIN, DetectionConfidence.MEDIUM
    
    def _get_confidence(self, probability: float) -> DetectionConfidence:
        """Convert probability to confidence level."""
        if probability >= 0.8:
            return DetectionConfidence.VERY_HIGH
        elif probability >= 0.6:
            return DetectionConfidence.HIGH
        elif probability >= 0.4:
            return DetectionConfidence.MEDIUM
        elif probability >= 0.2:
            return DetectionConfidence.LOW
        else:
            return DetectionConfidence.VERY_LOW


class DetectorService:
    """
    Main detector service that orchestrates multiple detection methods.
    
    This service provides a unified interface for running text through
    multiple AI detectors and aggregating the results into a comprehensive
    verification report.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the detector service."""
        self.config = config or {}
        self.logger = setup_logging(self.__class__.__name__)
        self.detectors: Dict[str, BaseDetector] = {}
        self._initialized = False
    
    async def initialize(self) -> bool:
        """Initialize all configured detectors."""
        self.logger.info("Initializing AI detector service")
        
        try:
            # Initialize perplexity detector
            if self.config.get("enable_perplexity", True):
                perplexity_detector = PerplexityDetector()
                if await perplexity_detector.initialize():
                    self.detectors["perplexity"] = perplexity_detector
                    self.logger.info("Perplexity detector initialized")
            
            # Initialize RoBERTa detector
            if self.config.get("enable_roberta", True):
                roberta_detector = RoBERTaDetector()
                if await roberta_detector.initialize():
                    self.detectors["roberta"] = roberta_detector
                    self.logger.info("RoBERTa detector initialized")
            
            # Initialize commercial detectors
            commercial_apis = self.config.get("commercial_apis", [])
            for api_config in commercial_apis:
                if api_config.get("enabled", False):
                    detector = CommercialAPIDetector(api_config)
                    if await detector.initialize():
                        detector_name = f"commercial_{api_config['name']}"
                        self.detectors[detector_name] = detector
                        self.logger.info(f"Commercial detector {api_config['name']} initialized")
            
            self._initialized = True
            self.logger.info(f"Detector service initialized with {len(self.detectors)} detectors")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize detector service: {e}")
            return False
    
    async def verify_text(
        self,
        text: str,
        text_id: Optional[str] = None,
        run_parallel: bool = True,
        detector_filter: Optional[List[str]] = None
    ) -> VerificationReport:
        """
        Run comprehensive AI detection verification on text.
        
        Args:
            text: Text to analyze
            text_id: Optional identifier for the text
            run_parallel: Whether to run detectors in parallel
            detector_filter: Optional list of detector names to run
            
        Returns:
            VerificationReport: Comprehensive verification results
        """
        if not self._initialized:
            await self.initialize()
        
        text_id = text_id or f"text_{int(time.time())}"
        start_time = time.time()
        
        self.logger.info(f"Starting verification for text {text_id} (length: {len(text)})")
        
        # Filter detectors if specified
        active_detectors = self.detectors
        if detector_filter:
            active_detectors = {k: v for k, v in self.detectors.items() if k in detector_filter}
        
        # Run detections
        if run_parallel:
            detection_scores = await self._run_parallel_detection(text, active_detectors)
        else:
            detection_scores = await self._run_sequential_detection(text, active_detectors)
        
        # Aggregate results
        report = self._create_verification_report(
            text_id=text_id,
            text=text,
            scores=detection_scores,
            total_time_ms=(time.time() - start_time) * 1000
        )
        
        self.logger.info(
            f"Verification completed for {text_id}",
            overall_result=report.overall_result.value,
            ai_probability=report.ai_probability_avg,
            detector_count=len(detection_scores)
        )
        
        return report
    
    async def _run_parallel_detection(
        self,
        text: str,
        detectors: Dict[str, BaseDetector]
    ) -> List[DetectionScore]:
        """Run detectors in parallel for faster processing."""
        tasks = []
        
        for detector_name, detector in detectors.items():
            task = asyncio.create_task(
                self._safe_detect(detector, text, detector_name)
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return valid results
        detection_scores = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                detector_name = list(detectors.keys())[i]
                self.logger.error(f"Detector {detector_name} failed: {result}")
                # Create error score
                error_score = DetectionScore(
                    detector_name=detector_name,
                    detector_type="unknown",
                    ai_probability=0.5,  # Neutral
                    confidence=DetectionConfidence.VERY_LOW,
                    result=DetectionResult.UNCERTAIN,
                    processing_time_ms=0,
                    metadata={},
                    error=str(result)
                )
                detection_scores.append(error_score)
            else:
                detection_scores.append(result)
        
        return detection_scores
    
    async def _run_sequential_detection(
        self,
        text: str,
        detectors: Dict[str, BaseDetector]
    ) -> List[DetectionScore]:
        """Run detectors sequentially for debugging or resource constraints."""
        detection_scores = []
        
        for detector_name, detector in detectors.items():
            try:
                score = await self._safe_detect(detector, text, detector_name)
                detection_scores.append(score)
            except Exception as e:
                self.logger.error(f"Detector {detector_name} failed: {e}")
                error_score = DetectionScore(
                    detector_name=detector_name,
                    detector_type=detector.detector_type,
                    ai_probability=0.5,
                    confidence=DetectionConfidence.VERY_LOW,
                    result=DetectionResult.UNCERTAIN,
                    processing_time_ms=0,
                    metadata={},
                    error=str(e)
                )
                detection_scores.append(error_score)
        
        return detection_scores
    
    async def _safe_detect(
        self,
        detector: BaseDetector,
        text: str,
        detector_name: str
    ) -> DetectionScore:
        """Safely run a detector with timeout and error handling."""
        try:
            # Set timeout for detection (configurable)
            timeout = self.config.get("detection_timeout", 60)  # seconds
            
            result = await asyncio.wait_for(
                detector.detect(text),
                timeout=timeout
            )
            
            return result
            
        except asyncio.TimeoutError:
            self.logger.warning(f"Detector {detector_name} timed out")
            return DetectionScore(
                detector_name=detector_name,
                detector_type=detector.detector_type,
                ai_probability=0.5,
                confidence=DetectionConfidence.VERY_LOW,
                result=DetectionResult.UNCERTAIN,
                processing_time_ms=timeout * 1000,
                metadata={},
                error="Detection timeout"
            )
        
        except Exception as e:
            self.logger.error(f"Detector {detector_name} error: {e}")
            return DetectionScore(
                detector_name=detector_name,
                detector_type=detector.detector_type,
                ai_probability=0.5,
                confidence=DetectionConfidence.VERY_LOW,
                result=DetectionResult.UNCERTAIN,
                processing_time_ms=0,
                metadata={},
                error=str(e)
            )
    
    def _create_verification_report(
        self,
        text_id: str,
        text: str,
        scores: List[DetectionScore],
        total_time_ms: float
    ) -> VerificationReport:
        """Create comprehensive verification report from detector results."""
        
        # Calculate aggregate metrics
        valid_scores = [s for s in scores if s.error is None]
        
        if not valid_scores:
            # All detectors failed
            return VerificationReport(
                text_id=text_id,
                text_sample=text[:100] + "..." if len(text) > 100 else text,
                overall_result=DetectionResult.UNCERTAIN,
                overall_confidence=DetectionConfidence.VERY_LOW,
                ai_probability_avg=0.5,
                processing_time_total_ms=total_time_ms,
                detector_scores=scores,
                recommendations=["All detectors failed - manual review required"],
                metadata={"error": "all_detectors_failed"},
                timestamp=time.time()
            )
        
        # Calculate weighted average (could be enhanced with detector-specific weights)
        ai_prob_sum = sum(score.ai_probability for score in valid_scores)
        ai_probability_avg = ai_prob_sum / len(valid_scores)
        
        # Determine overall result based on threshold
        threshold = self.config.get("ai_probability_threshold", 0.5)
        
        if ai_probability_avg < threshold - 0.2:
            overall_result = DetectionResult.HUMAN
        elif ai_probability_avg > threshold + 0.2:
            overall_result = DetectionResult.AI_GENERATED
        else:
            overall_result = DetectionResult.UNCERTAIN
        
        # Calculate overall confidence based on agreement between detectors
        confidence = self._calculate_overall_confidence(valid_scores, ai_probability_avg)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(overall_result, valid_scores, ai_probability_avg)
        
        return VerificationReport(
            text_id=text_id,
            text_sample=text[:100] + "..." if len(text) > 100 else text,
            overall_result=overall_result,
            overall_confidence=confidence,
            ai_probability_avg=ai_probability_avg,
            processing_time_total_ms=total_time_ms,
            detector_scores=scores,
            recommendations=recommendations,
            metadata={
                "valid_detectors": len(valid_scores),
                "failed_detectors": len(scores) - len(valid_scores),
                "threshold_used": threshold
            },
            timestamp=time.time()
        )
    
    def _calculate_overall_confidence(
        self,
        scores: List[DetectionScore],
        avg_probability: float
    ) -> DetectionConfidence:
        """Calculate overall confidence based on detector agreement."""
        if len(scores) < 2:
            return DetectionConfidence.LOW
        
        # Calculate variance in predictions
        variance = sum((score.ai_probability - avg_probability) ** 2 for score in scores) / len(scores)
        
        # Lower variance = higher confidence
        if variance < 0.05:  # Very low variance
            return DetectionConfidence.VERY_HIGH
        elif variance < 0.1:
            return DetectionConfidence.HIGH
        elif variance < 0.2:
            return DetectionConfidence.MEDIUM
        elif variance < 0.3:
            return DetectionConfidence.LOW
        else:
            return DetectionConfidence.VERY_LOW
    
    def _generate_recommendations(
        self,
        overall_result: DetectionResult,
        scores: List[DetectionScore],
        avg_probability: float
    ) -> List[str]:
        """Generate actionable recommendations based on verification results."""
        recommendations = []
        
        if overall_result == DetectionResult.AI_GENERATED:
            recommendations.append("Text appears to be AI-generated - consider reprocessing with modified prompts")
            
            if avg_probability > 0.8:
                recommendations.append("High AI probability detected - aggressive humanization required")
            
            # Check which detectors flagged it most strongly
            high_ai_detectors = [s.detector_name for s in scores if s.ai_probability > 0.7]
            if high_ai_detectors:
                recommendations.append(f"Flagged by: {', '.join(high_ai_detectors)}")
        
        elif overall_result == DetectionResult.HUMAN:
            recommendations.append("Text appears human-written - verification passed")
            
        else:  # UNCERTAIN
            recommendations.append("Detection results uncertain - manual review recommended")
            
            # Check for conflicting detector results
            ai_votes = sum(1 for s in scores if s.result == DetectionResult.AI_GENERATED)
            human_votes = sum(1 for s in scores if s.result == DetectionResult.HUMAN)
            
            if ai_votes > 0 and human_votes > 0:
                recommendations.append("Conflicting detector results - consider additional verification methods")
        
        # Add detector-specific recommendations
        failed_detectors = [s.detector_name for s in scores if s.error is not None]
        if failed_detectors:
            recommendations.append(f"Failed detectors: {', '.join(failed_detectors)} - check system health")
        
        return recommendations
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of all detectors."""
        if not self._initialized:
            return {"status": "not_initialized", "detectors": {}}
        
        detector_health = {}
        
        for name, detector in self.detectors.items():
            try:
                is_healthy = await detector.health_check()
                detector_health[name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "type": detector.detector_type
                }
            except Exception as e:
                detector_health[name] = {
                    "status": "error",
                    "error": str(e),
                    "type": detector.detector_type
                }
        
        overall_status = "healthy" if all(
            d["status"] == "healthy" for d in detector_health.values()
        ) else "degraded"
        
        return {
            "status": overall_status,
            "detectors": detector_health,
            "total_detectors": len(self.detectors),
            "initialized": self._initialized
        }
    
    def get_available_detectors(self) -> Dict[str, str]:
        """Get list of available detectors."""
        return {name: detector.detector_type for name, detector in self.detectors.items()}


# Global detector service instance
_detector_service: Optional[DetectorService] = None


async def get_detector_service(config: Optional[Dict[str, Any]] = None) -> DetectorService:
    """Get or create the global detector service instance."""
    global _detector_service
    
    if _detector_service is None:
        _detector_service = DetectorService(config)
        await _detector_service.initialize()
    
    return _detector_service
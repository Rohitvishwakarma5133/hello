"""
MongoDB storage system for verification results and analytics.

This module provides comprehensive storage and analytics capabilities for:
- Verification results from all detector types
- Refinement iteration history and improvements
- Performance metrics and detector effectiveness
- Continuous improvement analytics and insights
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import asdict
import pymongo
from pymongo import MongoClient, IndexModel
from pymongo.errors import PyMongoError
import statistics

from ..models.detection_models import (
    DetectionResult, VerificationReport, VerificationConfig
)

# Configure logging
logger = logging.getLogger(__name__)


class VerificationStorage:
    """
    MongoDB storage service for verification results and analytics.
    
    Provides methods for storing, querying, and analyzing verification data
    to support continuous improvement of the humanization process.
    """
    
    def __init__(self, connection_string: str, database_name: str = "humanization_db"):
        """
        Initialize the verification storage service.
        
        Args:
            connection_string: MongoDB connection string
            database_name: Name of the database to use
        """
        self.client = MongoClient(connection_string)
        self.db = self.client[database_name]
        
        # Collection references
        self.verification_results = self.db.verification_results
        self.refinement_history = self.db.refinement_history
        self.detector_performance = self.db.detector_performance
        self.job_tracking = self.db.job_tracking
        
        # Ensure indexes for efficient queries
        self._create_indexes()
    
    def _create_indexes(self):
        """Create necessary indexes for efficient querying."""
        try:
            # Verification results indexes
            verification_indexes = [
                IndexModel([("job_id", 1)]),
                IndexModel([("timestamp", -1)]),
                IndexModel([("overall_ai_probability", 1)]),
                IndexModel([("passed_verification", 1)]),
                IndexModel([("detector_results.detector_name", 1)]),
                IndexModel([("verification_config.detectors", 1)]),
                IndexModel([("timestamp", -1), ("passed_verification", 1)])
            ]
            self.verification_results.create_indexes(verification_indexes)
            
            # Refinement history indexes
            refinement_indexes = [
                IndexModel([("job_id", 1)]),
                IndexModel([("iteration", 1)]),
                IndexModel([("started_at", -1)]),
                IndexModel([("final_status", 1)]),
                IndexModel([("job_id", 1), ("iteration", 1)])
            ]
            self.refinement_history.create_indexes(refinement_indexes)
            
            # Detector performance indexes
            performance_indexes = [
                IndexModel([("detector_name", 1)]),
                IndexModel([("date", -1)]),
                IndexModel([("detector_name", 1), ("date", -1)])
            ]
            self.detector_performance.create_indexes(performance_indexes)
            
            # Job tracking indexes
            job_indexes = [
                IndexModel([("job_id", 1)], unique=True),
                IndexModel([("created_at", -1)]),
                IndexModel([("final_status", 1)]),
                IndexModel([("processing_time", 1)])
            ]
            self.job_tracking.create_indexes(job_indexes)
            
            logger.info("Database indexes created successfully")
            
        except PyMongoError as e:
            logger.error(f"Error creating database indexes: {e}")
            raise
    
    def store_verification_result(self, job_id: str, verification_report: VerificationReport, 
                                 config: VerificationConfig, text_length: int,
                                 processing_time: float) -> str:
        """
        Store verification results in MongoDB.
        
        Args:
            job_id: Unique job identifier
            verification_report: Complete verification report
            config: Verification configuration used
            text_length: Length of the verified text
            processing_time: Total processing time
            
        Returns:
            str: Document ID of stored result
        """
        try:
            # Prepare verification document
            verification_doc = {
                "job_id": job_id,
                "timestamp": datetime.utcnow(),
                "text_length": text_length,
                "processing_time": processing_time,
                
                # Verification configuration
                "verification_config": {
                    "detectors": config.detectors,
                    "parallel_execution": config.parallel_execution,
                    "timeout": config.timeout,
                    "ai_threshold": config.ai_threshold,
                    "confidence_threshold": config.confidence_threshold
                },
                
                # Overall results
                "overall_ai_probability": verification_report.overall_ai_probability,
                "overall_confidence": verification_report.overall_confidence,
                "recommendation": verification_report.recommendation.value,
                "passed_verification": verification_report.recommendation.value == "ACCEPT",
                
                # Individual detector results
                "detector_results": [
                    {
                        "detector_name": result.detector_name,
                        "ai_probability": result.ai_probability,
                        "confidence": result.confidence,
                        "processing_time": result.processing_time,
                        "metadata": result.metadata
                    }
                    for result in verification_report.detector_results
                ],
                
                # Processing metadata
                "detectors_attempted": len(config.detectors),
                "detectors_successful": len([r for r in verification_report.detector_results if r.confidence > 0.5]),
                "average_processing_time": statistics.mean([r.processing_time for r in verification_report.detector_results])
            }
            
            # Insert verification result
            result = self.verification_results.insert_one(verification_doc)
            
            # Update detector performance metrics
            self._update_detector_performance(verification_report.detector_results)
            
            logger.info(f"Verification result stored for job {job_id}")
            return str(result.inserted_id)
            
        except PyMongoError as e:
            logger.error(f"Error storing verification result for job {job_id}: {e}")
            raise
    
    def store_refinement_attempt(self, job_id: str, iteration: int, refinement_data: Dict[str, Any]) -> str:
        """
        Store refinement iteration data.
        
        Args:
            job_id: Job identifier
            iteration: Refinement iteration number
            refinement_data: Complete refinement attempt data
            
        Returns:
            str: Document ID of stored refinement record
        """
        try:
            refinement_doc = {
                "job_id": job_id,
                "iteration": iteration,
                "started_at": datetime.fromtimestamp(refinement_data.get("started_at", datetime.utcnow().timestamp())),
                "completed_at": datetime.fromtimestamp(refinement_data.get("completed_at", datetime.utcnow().timestamp())),
                "processing_time": refinement_data.get("processing_time", 0),
                
                # AI probability changes
                "previous_ai_probability": refinement_data.get("previous_ai_probability", 0),
                "new_ai_probability": refinement_data.get("new_ai_probability", 0),
                "improvement": refinement_data.get("improvement", 0),
                
                # Results
                "passed_verification": refinement_data.get("passed_verification", False),
                "recommendation": refinement_data.get("recommendation", "UNKNOWN"),
                "status": refinement_data.get("status", "unknown"),
                
                # Refinement strategy
                "refined_prompt": refinement_data.get("refined_prompt", ""),
                "text_length": refinement_data.get("text_length", 0),
                
                # Error handling
                "error": refinement_data.get("error", None)
            }
            
            result = self.refinement_history.insert_one(refinement_doc)
            
            logger.info(f"Refinement attempt {iteration} stored for job {job_id}")
            return str(result.inserted_id)
            
        except PyMongoError as e:
            logger.error(f"Error storing refinement attempt for job {job_id}, iteration {iteration}: {e}")
            raise
    
    def store_job_completion(self, job_id: str, final_status: str, total_processing_time: float,
                           iterations_used: int = 0, final_ai_probability: float = 0.0) -> str:
        """
        Store final job completion data.
        
        Args:
            job_id: Job identifier
            final_status: Final status (COMPLETED/EXHAUSTED/ERROR)
            total_processing_time: Total time for entire job
            iterations_used: Number of refinement iterations used
            final_ai_probability: Final AI probability score
            
        Returns:
            str: Document ID of stored job record
        """
        try:
            job_doc = {
                "job_id": job_id,
                "created_at": datetime.utcnow(),
                "final_status": final_status,
                "total_processing_time": total_processing_time,
                "iterations_used": iterations_used,
                "final_ai_probability": final_ai_probability,
                "completed_successfully": final_status == "COMPLETED"
            }
            
            # Update existing job record or create new one
            result = self.job_tracking.update_one(
                {"job_id": job_id},
                {"$set": job_doc},
                upsert=True
            )
            
            logger.info(f"Job completion data stored for {job_id}")
            return str(result.upserted_id) if result.upserted_id else "updated"
            
        except PyMongoError as e:
            logger.error(f"Error storing job completion for {job_id}: {e}")
            raise
    
    def _update_detector_performance(self, detector_results: List[DetectionResult]):
        """Update daily performance metrics for each detector."""
        try:
            today = datetime.utcnow().date()
            
            for result in detector_results:
                # Calculate performance metrics
                performance_update = {
                    "$inc": {
                        "total_runs": 1,
                        "total_processing_time": result.processing_time,
                        "confidence_sum": result.confidence
                    },
                    "$push": {
                        "ai_probabilities": result.ai_probability,
                        "processing_times": result.processing_time
                    },
                    "$set": {
                        "last_updated": datetime.utcnow()
                    }
                }
                
                self.detector_performance.update_one(
                    {
                        "detector_name": result.detector_name,
                        "date": today
                    },
                    performance_update,
                    upsert=True
                )
            
        except PyMongoError as e:
            logger.error(f"Error updating detector performance: {e}")
    
    def get_verification_analytics(self, days_back: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive analytics for verification performance.
        
        Args:
            days_back: Number of days to include in analysis
            
        Returns:
            Dict containing analytics data
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Overall verification statistics
            total_verifications = self.verification_results.count_documents(
                {"timestamp": {"$gte": cutoff_date}}
            )
            
            passed_verifications = self.verification_results.count_documents({
                "timestamp": {"$gte": cutoff_date},
                "passed_verification": True
            })
            
            # Average processing times
            processing_times = list(self.verification_results.find(
                {"timestamp": {"$gte": cutoff_date}},
                {"processing_time": 1}
            ))
            avg_processing_time = statistics.mean([doc["processing_time"] for doc in processing_times]) if processing_times else 0
            
            # AI probability distribution
            ai_probs = list(self.verification_results.find(
                {"timestamp": {"$gte": cutoff_date}},
                {"overall_ai_probability": 1}
            ))
            ai_prob_stats = self._calculate_distribution_stats([doc["overall_ai_probability"] for doc in ai_probs])
            
            # Detector performance
            detector_performance = self._get_detector_analytics(cutoff_date)
            
            # Refinement effectiveness
            refinement_stats = self._get_refinement_analytics(cutoff_date)
            
            return {
                "period_days": days_back,
                "total_verifications": total_verifications,
                "passed_verifications": passed_verifications,
                "pass_rate": passed_verifications / total_verifications if total_verifications > 0 else 0,
                "average_processing_time": avg_processing_time,
                "ai_probability_distribution": ai_prob_stats,
                "detector_performance": detector_performance,
                "refinement_statistics": refinement_stats
            }
            
        except PyMongoError as e:
            logger.error(f"Error retrieving verification analytics: {e}")
            raise
    
    def _get_detector_analytics(self, cutoff_date: datetime) -> Dict[str, Any]:
        """Get performance analytics for individual detectors."""
        try:
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff_date}}},
                {"$unwind": "$detector_results"},
                {
                    "$group": {
                        "_id": "$detector_results.detector_name",
                        "total_runs": {"$sum": 1},
                        "avg_ai_probability": {"$avg": "$detector_results.ai_probability"},
                        "avg_confidence": {"$avg": "$detector_results.confidence"},
                        "avg_processing_time": {"$avg": "$detector_results.processing_time"},
                        "ai_probabilities": {"$push": "$detector_results.ai_probability"}
                    }
                }
            ]
            
            detector_stats = {}
            for doc in self.verification_results.aggregate(pipeline):
                detector_name = doc["_id"]
                detector_stats[detector_name] = {
                    "total_runs": doc["total_runs"],
                    "average_ai_probability": doc["avg_ai_probability"],
                    "average_confidence": doc["avg_confidence"],
                    "average_processing_time": doc["avg_processing_time"],
                    "ai_probability_stats": self._calculate_distribution_stats(doc["ai_probabilities"])
                }
            
            return detector_stats
            
        except PyMongoError as e:
            logger.error(f"Error getting detector analytics: {e}")
            return {}
    
    def _get_refinement_analytics(self, cutoff_date: datetime) -> Dict[str, Any]:
        """Get analytics for refinement effectiveness."""
        try:
            # Total refinement attempts
            total_refinements = self.refinement_history.count_documents(
                {"started_at": {"$gte": cutoff_date}}
            )
            
            # Successful refinements
            successful_refinements = self.refinement_history.count_documents({
                "started_at": {"$gte": cutoff_date},
                "passed_verification": True
            })
            
            # Average improvement per iteration
            improvements = list(self.refinement_history.find(
                {"started_at": {"$gte": cutoff_date}, "improvement": {"$exists": True}},
                {"improvement": 1}
            ))
            avg_improvement = statistics.mean([doc["improvement"] for doc in improvements]) if improvements else 0
            
            # Refinement iteration distribution
            iteration_stats = list(self.refinement_history.aggregate([
                {"$match": {"started_at": {"$gte": cutoff_date}}},
                {
                    "$group": {
                        "_id": "$iteration",
                        "count": {"$sum": 1},
                        "success_rate": {
                            "$avg": {"$cond": [{"$eq": ["$passed_verification", True]}, 1, 0]}
                        }
                    }
                },
                {"$sort": {"_id": 1}}
            ]))
            
            return {
                "total_refinement_attempts": total_refinements,
                "successful_refinements": successful_refinements,
                "refinement_success_rate": successful_refinements / total_refinements if total_refinements > 0 else 0,
                "average_improvement": avg_improvement,
                "iteration_statistics": [
                    {
                        "iteration": stat["_id"],
                        "attempts": stat["count"],
                        "success_rate": stat["success_rate"]
                    }
                    for stat in iteration_stats
                ]
            }
            
        except PyMongoError as e:
            logger.error(f"Error getting refinement analytics: {e}")
            return {}
    
    def _calculate_distribution_stats(self, values: List[float]) -> Dict[str, float]:
        """Calculate statistical distribution for a list of values."""
        if not values:
            return {"mean": 0, "median": 0, "std_dev": 0, "min": 0, "max": 0}
        
        return {
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "std_dev": statistics.stdev(values) if len(values) > 1 else 0,
            "min": min(values),
            "max": max(values),
            "count": len(values)
        }
    
    def get_job_history(self, job_id: str) -> Dict[str, Any]:
        """
        Get complete history for a specific job.
        
        Args:
            job_id: Job identifier
            
        Returns:
            Dict containing complete job history
        """
        try:
            # Get verification results
            verification = self.verification_results.find_one({"job_id": job_id})
            
            # Get refinement history
            refinements = list(self.refinement_history.find(
                {"job_id": job_id}
            ).sort("iteration", 1))
            
            # Get job tracking info
            job_info = self.job_tracking.find_one({"job_id": job_id})
            
            return {
                "job_id": job_id,
                "verification_result": verification,
                "refinement_history": refinements,
                "job_info": job_info,
                "total_iterations": len(refinements)
            }
            
        except PyMongoError as e:
            logger.error(f"Error retrieving job history for {job_id}: {e}")
            raise
    
    def get_detector_effectiveness_report(self, detector_name: str, days_back: int = 30) -> Dict[str, Any]:
        """
        Get detailed effectiveness report for a specific detector.
        
        Args:
            detector_name: Name of the detector to analyze
            days_back: Number of days to include in analysis
            
        Returns:
            Dict containing detector effectiveness data
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff_date}}},
                {"$unwind": "$detector_results"},
                {"$match": {"detector_results.detector_name": detector_name}},
                {
                    "$group": {
                        "_id": None,
                        "total_runs": {"$sum": 1},
                        "avg_ai_probability": {"$avg": "$detector_results.ai_probability"},
                        "avg_confidence": {"$avg": "$detector_results.confidence"},
                        "avg_processing_time": {"$avg": "$detector_results.processing_time"},
                        "ai_probabilities": {"$push": "$detector_results.ai_probability"},
                        "confidences": {"$push": "$detector_results.confidence"},
                        "processing_times": {"$push": "$detector_results.processing_time"}
                    }
                }
            ]
            
            result = list(self.verification_results.aggregate(pipeline))
            
            if not result:
                return {"detector_name": detector_name, "no_data": True}
            
            data = result[0]
            
            return {
                "detector_name": detector_name,
                "period_days": days_back,
                "total_runs": data["total_runs"],
                "ai_probability_stats": self._calculate_distribution_stats(data["ai_probabilities"]),
                "confidence_stats": self._calculate_distribution_stats(data["confidences"]),
                "processing_time_stats": self._calculate_distribution_stats(data["processing_times"]),
                "effectiveness_score": self._calculate_detector_effectiveness_score(data)
            }
            
        except PyMongoError as e:
            logger.error(f"Error getting detector effectiveness report for {detector_name}: {e}")
            raise
    
    def _calculate_detector_effectiveness_score(self, detector_data: Dict) -> float:
        """Calculate an effectiveness score for a detector based on various metrics."""
        # Normalize metrics (0-1 scale)
        confidence_score = detector_data["avg_confidence"]
        
        # Processing time score (faster is better, normalize to 0-1)
        processing_time_score = max(0, 1 - (detector_data["avg_processing_time"] / 60))  # Assume 60s is max reasonable time
        
        # Consistency score (lower std dev is better)
        ai_prob_std = statistics.stdev(detector_data["ai_probabilities"]) if len(detector_data["ai_probabilities"]) > 1 else 0
        consistency_score = max(0, 1 - (ai_prob_std / 0.5))  # Normalize by expected max std dev
        
        # Weighted effectiveness score
        effectiveness_score = (
            0.4 * confidence_score +
            0.3 * consistency_score +
            0.3 * processing_time_score
        )
        
        return round(effectiveness_score, 3)
    
    def close(self):
        """Close the MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Singleton instance for global access
_storage_instance = None

def get_verification_storage(connection_string: str = None, database_name: str = "humanization_db") -> VerificationStorage:
    """
    Get or create a singleton instance of VerificationStorage.
    
    Args:
        connection_string: MongoDB connection string
        database_name: Database name to use
        
    Returns:
        VerificationStorage: Singleton storage instance
    """
    global _storage_instance
    
    if _storage_instance is None:
        if connection_string is None:
            raise ValueError("connection_string must be provided for first initialization")
        _storage_instance = VerificationStorage(connection_string, database_name)
    
    return _storage_instance
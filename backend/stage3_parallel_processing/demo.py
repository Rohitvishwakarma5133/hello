#!/usr/bin/env python3
"""
Stage 3 - Parallel Processing Architecture Demo

This script demonstrates the capabilities of the parallel processing
system built with Celery and Redis. It showcases:

1. Text chunking and parallel processing
2. Real-time monitoring and progress tracking
3. Error handling and resilience
4. Performance metrics collection
5. Health checks and system status

Usage:
    python demo.py --mode=interactive    # Interactive demo mode
    python demo.py --mode=automated      # Automated demo with sample data
    python demo.py --mode=health         # Health check only
    python demo.py --mode=monitoring     # Monitoring dashboard

Prerequisites:
    - Redis server running on localhost:6379
    - OpenAI API key configured
    - Celery worker processes started
"""

import asyncio
import time
import json
import sys
import argparse
from typing import List, Dict, Any, Optional
from pathlib import Path

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.services.orchestration_service import OrchestrationService
from src.services.monitoring_service import get_monitoring_service
from src.config.settings import get_settings
from src.utils.logging import setup_logging


class Stage3Demo:
    """
    Interactive demo for Stage 3 parallel processing capabilities.
    
    This demo showcases the complete workflow from text ingestion
    to parallel processing and result aggregation.
    """
    
    def __init__(self):
        """Initialize the demo system."""
        self.logger = setup_logging("Stage3Demo")
        self.settings = get_settings()
        self.orchestrator = OrchestrationService()
        self.monitoring = get_monitoring_service()
        
        print("🚀 Stage 3 - Parallel Processing Architecture Demo")
        print("=" * 60)
    
    def run_health_check(self) -> Dict[str, Any]:
        """Run comprehensive health check."""
        print("\n🏥 Running System Health Check...")
        
        health_result = self.monitoring.health_check()
        
        print(f"\n📊 Overall Status: {health_result['overall_status'].upper()}")
        print(f"⏱️  Check Duration: {health_result['check_duration_ms']:.1f}ms")
        print(f"🏷️  Version: {health_result['version']}")
        print(f"🌍 Environment: {health_result['environment']}")
        
        print("\n📋 Service Details:")
        for service_name, service_data in health_result['services'].items():
            status_emoji = {
                "healthy": "✅",
                "degraded": "⚠️",
                "unhealthy": "❌",
                "unknown": "❓"
            }.get(service_data['status'], "❓")
            
            print(f"  {status_emoji} {service_name.title()}: {service_data['message']}")
            if service_data.get('response_time_ms'):
                print(f"    └── Response Time: {service_data['response_time_ms']:.1f}ms")
        
        return health_result
    
    def create_sample_chunks(self) -> List[Dict[str, Any]]:
        """Create sample text chunks for demonstration."""
        sample_text = """
        Artificial intelligence has revolutionized numerous industries by automating complex tasks 
        and providing intelligent insights. Machine learning algorithms can process vast amounts of 
        data to identify patterns and make predictions with remarkable accuracy.
        
        The development of natural language processing has enabled computers to understand and 
        generate human-like text. This capability has led to the creation of chatbots, translation 
        services, and content generation tools that assist users in various applications.
        
        Deep learning neural networks have achieved breakthrough performance in image recognition,
        speech processing, and game playing. These systems can now surpass human performance in 
        many specialized tasks while continuing to improve through additional training data.
        
        The future of AI holds promise for even more sophisticated applications including autonomous
        vehicles, medical diagnosis, and scientific research acceleration. However, ethical 
        considerations and responsible development remain crucial for ensuring beneficial outcomes.
        """
        
        # Simple chunking by sentences for demo purposes
        sentences = [s.strip() for s in sample_text.split('.') if s.strip()]
        
        chunks = []
        for i, sentence in enumerate(sentences[:6]):  # Limit to 6 chunks for demo
            if sentence:  # Skip empty sentences
                chunks.append({
                    "id": f"demo_chunk_{i}",
                    "content": sentence + ".",
                    "index": i,
                    "metadata": {
                        "source": "demo",
                        "length": len(sentence),
                        "type": "sentence"
                    }
                })
        
        return chunks
    
    def create_humanization_prompt(self) -> str:
        """Create a sample humanization prompt."""
        return """
        You are an expert text editor tasked with making AI-generated content more natural and human-like.
        
        Please rewrite the following text to:
        1. Add natural variations in sentence structure
        2. Include more conversational language
        3. Introduce subtle imperfections that humans naturally make
        4. Vary the rhythm and flow of the text
        5. Preserve the original meaning and key information
        
        Make the text sound like it was written by a knowledgeable human rather than an AI system.
        """
    
    def run_parallel_processing_demo(self) -> Dict[str, Any]:
        """Demonstrate parallel text processing."""
        print("\n🔄 Starting Parallel Processing Demo...")
        
        # Create sample data
        chunks = self.create_sample_chunks()
        prompt = self.create_humanization_prompt()
        
        print(f"📝 Created {len(chunks)} text chunks for processing")
        print("📋 Sample chunk preview:")
        for i, chunk in enumerate(chunks[:2]):  # Show first 2 chunks
            print(f"  {i+1}. {chunk['content'][:80]}...")
        
        # Start parallel processing
        print("\n⚡ Initiating parallel workflow...")
        
        try:
            result = self.orchestrator.process_text_parallel(
                chunks=chunks,
                humanization_prompt=prompt,
                job_id=f"demo_{int(time.time())}",
                enable_verification=False,  # Disable verification for demo
                workflow_metadata={"demo_mode": True}
            )
            
            print(f"🎯 Job initiated successfully!")
            print(f"   Job ID: {result['job_id']}")
            print(f"   Workflow Type: {result['workflow_type']}")
            print(f"   Chunks: {result['chunk_count']}")
            print(f"   Estimated Time: {result['estimated_completion_time']:.1f}s")
            
            # Monitor progress
            self.monitor_job_progress(result['job_id'], result['task_ids'])
            
            return result
            
        except Exception as e:
            print(f"❌ Error during parallel processing: {e}")
            self.logger.error(f"Demo processing error: {e}")
            return {"error": str(e)}
    
    def monitor_job_progress(self, job_id: str, task_ids: Dict[str, Any], timeout: int = 120) -> None:
        """Monitor job progress with real-time updates."""
        print(f"\n📊 Monitoring job progress (timeout: {timeout}s)...")
        
        start_time = time.time()
        last_status = None
        
        while time.time() - start_time < timeout:
            try:
                status = self.orchestrator.get_job_status(job_id, task_ids)
                
                if status.get('status') != last_status:
                    print(f"   Status: {status.get('status', 'unknown')}")
                    
                    if 'progress' in status:
                        progress = status['progress']
                        percentage = progress.get('percentage', 0)
                        completed = progress.get('completed_chunks', 0)
                        total = progress.get('total_chunks', 0)
                        stage = progress.get('stage', 'unknown')
                        
                        print(f"   Progress: {percentage:.1f}% ({completed}/{total} chunks) - {stage}")
                    
                    last_status = status.get('status')
                
                # Check if job is complete
                if status.get('status') in ['SUCCESS', 'FAILURE', 'REVOKED']:
                    if status.get('status') == 'SUCCESS':
                        print("✅ Job completed successfully!")
                        if 'result' in status:
                            self.display_results(status['result'])
                    else:
                        print(f"❌ Job failed with status: {status.get('status')}")
                        if 'error' in status:
                            print(f"   Error: {status['error']}")
                    break
                
                time.sleep(2)  # Poll every 2 seconds
                
            except Exception as e:
                print(f"⚠️ Error monitoring job: {e}")
                break
        else:
            print("⏰ Monitoring timeout reached")
    
    def display_results(self, result: Dict[str, Any]) -> None:
        """Display processing results in a user-friendly format."""
        print("\n📋 Processing Results:")
        print("=" * 40)
        
        if 'processing_summary' in result:
            summary = result['processing_summary']
            print(f"Chunks Processed: {summary.get('chunks_processed', 0)}")
            print(f"Total Processing Time: {summary.get('total_processing_time', 0):.2f}s")
            print(f"Average per Chunk: {summary.get('average_chunk_processing_time', 0):.2f}s")
            
            if 'original_length' in summary and 'humanized_length' in summary:
                orig_len = summary['original_length']
                new_len = summary['humanized_length']
                change = ((new_len - orig_len) / orig_len * 100) if orig_len > 0 else 0
                print(f"Text Length Change: {change:+.1f}% ({orig_len} → {new_len} chars)")
        
        if 'token_usage_summary' in result:
            tokens = result['token_usage_summary']
            total_tokens = tokens.get('total_tokens', 0)
            print(f"Tokens Used: {total_tokens}")
        
        # Show a preview of the humanized text
        if 'humanized_text' in result:
            humanized = result['humanized_text']
            preview_length = 200
            preview = humanized[:preview_length]
            if len(humanized) > preview_length:
                preview += "..."
            
            print(f"\n📝 Humanized Text Preview:")
            print(f"   {preview}")
    
    def run_monitoring_dashboard(self) -> None:
        """Show a simple monitoring dashboard."""
        print("\n📈 System Monitoring Dashboard")
        print("=" * 40)
        
        try:
            # Get system metrics
            metrics = self.monitoring.get_metrics()
            
            print("🔧 Celery Metrics:")
            celery_metrics = metrics.get('celery_metrics', {})
            if 'error' not in celery_metrics:
                print(f"   Active Workers: {celery_metrics.get('active_workers', 0)}")
                print(f"   Active Tasks: {celery_metrics.get('active_tasks', 0)}")
                print(f"   Reserved Tasks: {celery_metrics.get('reserved_tasks', 0)}")
            else:
                print(f"   Error: {celery_metrics['error']}")
            
            print("\n💾 Redis Metrics:")
            redis_metrics = metrics.get('redis_metrics', {})
            if 'error' not in redis_metrics:
                print(f"   Memory Usage: {redis_metrics.get('memory_usage_mb', 0):.1f} MB")
                print(f"   Connected Clients: {redis_metrics.get('connected_clients', 0)}")
                print(f"   Commands Processed: {redis_metrics.get('total_commands_processed', 0):,}")
            else:
                print(f"   Error: {redis_metrics['error']}")
            
            # Get worker status
            print("\n👷 Worker Status:")
            worker_status = self.monitoring.get_worker_status()
            if 'error' not in worker_status:
                active_tasks = worker_status.get('active_tasks', {})
                if active_tasks:
                    for worker, tasks in active_tasks.items():
                        print(f"   {worker}: {len(tasks)} active tasks")
                else:
                    print("   No active tasks")
            else:
                print(f"   Error: {worker_status['error']}")
                
        except Exception as e:
            print(f"❌ Error retrieving metrics: {e}")
    
    def run_interactive_mode(self) -> None:
        """Run interactive demo mode."""
        print("\n🎮 Interactive Mode")
        print("Choose an option:")
        print("1. Run health check")
        print("2. Parallel processing demo")
        print("3. Monitoring dashboard")
        print("4. Exit")
        
        while True:
            try:
                choice = input("\nEnter your choice (1-4): ").strip()
                
                if choice == "1":
                    self.run_health_check()
                elif choice == "2":
                    self.run_parallel_processing_demo()
                elif choice == "3":
                    self.run_monitoring_dashboard()
                elif choice == "4":
                    print("👋 Goodbye!")
                    break
                else:
                    print("❌ Invalid choice. Please enter 1-4.")
                    
            except KeyboardInterrupt:
                print("\n👋 Demo interrupted by user")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def run_automated_mode(self) -> None:
        """Run automated demo with all features."""
        print("\n🤖 Automated Demo Mode")
        
        # 1. Health check
        health_result = self.run_health_check()
        
        # Only continue if system is healthy
        overall_status = health_result.get('overall_status', 'unknown')
        if overall_status == 'unhealthy':
            print("❌ System is unhealthy. Please check services before running demo.")
            return
        
        # 2. Monitoring dashboard
        self.run_monitoring_dashboard()
        
        # 3. Parallel processing demo
        processing_result = self.run_parallel_processing_demo()
        
        if 'error' not in processing_result:
            print("\n🎉 Automated demo completed successfully!")
        else:
            print(f"\n❌ Demo completed with errors: {processing_result['error']}")


def main():
    """Main demo entry point."""
    parser = argparse.ArgumentParser(description="Stage 3 Parallel Processing Demo")
    parser.add_argument(
        "--mode", 
        choices=["interactive", "automated", "health", "monitoring"],
        default="interactive",
        help="Demo mode to run"
    )
    
    args = parser.parse_args()
    
    try:
        demo = Stage3Demo()
        
        if args.mode == "interactive":
            demo.run_interactive_mode()
        elif args.mode == "automated":
            demo.run_automated_mode()
        elif args.mode == "health":
            demo.run_health_check()
        elif args.mode == "monitoring":
            demo.run_monitoring_dashboard()
            
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
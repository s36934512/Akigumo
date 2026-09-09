#!/usr/bin/env python3
"""Unified worker implementation for graph refinement engine.

Why: Consolidate multiple worker implementations.
Why: Support different processing modes.
Why: Enable graceful shutdown and error handling.
"""

import asyncio
import signal

import structlog

from akigumo.graph_kernel.core.config import config
from akigumo.graph_kernel.core.health import HealthChecker
from akigumo.graph_kernel.core.metrics import MetricsCollector
from akigumo.infrastructure.message_queue import graph_refinement_worker


class GraphRefinementWorker:
    """Unified worker for graph refinement tasks."""

    def __init__(self):
        self.logger = structlog.get_logger(__name__)
        self.metrics = MetricsCollector()
        self.health_checker = HealthChecker()
        self.running = False
        self.shutdown_event = asyncio.Event()
        self.batch_stream_worker = graph_refinement_worker

        # Lazy initialization
        self.redis_client = None
        self.neo4j_client = None
        self.batch_processor = None
        self.error_handler = None

    async def start(self) -> int:
        """Start the worker."""
        try:
            await self._initialize()
            self._setup_signal_handlers()
            self.running = True

            self.logger.info(
                "Starting graph refinement worker",
                mode=config.worker_mode,
                batch_size=config.batch_size,
                queue=config.redis_queue
            )

            self.metrics.set_active_workers(1)

            task = asyncio.create_task(self.batch_stream_worker.run(
                self.batch_processor.process_batch))

            try:
                await task
                exit_code = 0
            except asyncio.CancelledError:
                # 當 asyncio.run 被中斷時，會拋出 CancelledError
                print("偵測到取消請求...")
                exit_code = 0
            except Exception as e:
                print(f"Worker 運行失敗: {e}")
                self.logger.error(
                    "Worker failed during execution", error=str(e))
                exit_code = 1
            finally:
                # 確保無論如何都會執行到 stop
                await self.batch_stream_worker.stop()

            # if config.worker_mode == "batch":
            #     exit_code = await self._run_batch_mode()
            # elif config.worker_mode == "single":
            #     exit_code = await self._run_single_mode()
            # else:  # hybrid
            #     exit_code = await self._run_hybrid_mode()

            return exit_code

        except Exception as e:
            print(f"Worker failed to start: {e}")
            self.logger.error("Worker failed to start", error=str(e))
            return 1
        finally:
            await self._cleanup()

    async def _initialize(self):
        """Initialize all components."""
        # Import here to avoid circular imports
        from akigumo.graph_kernel.handlers.batch_processor import BatchProcessor
        from akigumo.graph_kernel.handlers.error_handler import ErrorHandler
        from akigumo.graph_kernel.storage.neo4j_client import Neo4jClient
        from akigumo.graph_kernel.storage.redis_client import RedisClient

        self.redis_client = RedisClient()
        self.neo4j_client = Neo4jClient()
        self.batch_processor = BatchProcessor(self.neo4j_client)
        self.error_handler = ErrorHandler(self.redis_client)

        # Initialize Neo4j schema
        await self.neo4j_client.ensure_schema()

    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown."""
        def signal_handler(signum, frame):
            self.logger.info("Received shutdown signal", signal=signum)
            self.shutdown_event.set()
            asyncio.create_task(self.batch_stream_worker.stop())

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    async def _run_batch_mode(self) -> int:
        """Run in batch processing mode."""
        self.logger.info("Running in batch mode")

        while not self.shutdown_event.is_set():
            try:
                # Get batch of tasks
                tasks = await self.redis_client.get_batch_tasks(
                    config.batch_size,
                    config.batch_timeout_ms
                )

                if tasks:
                    self.logger.debug("Processing batch",
                                      batch_size=len(tasks))

                    # Process batch with timing
                    with self.metrics.time_batch_processing() as timer:
                        await self.batch_processor.process_batch(tasks)

                    self.metrics.record_batch_processed(
                        len(tasks), timer.duration)
                    self.metrics.record_task_processed("batch", "success")
                else:
                    # No tasks available, wait a bit
                    await asyncio.sleep(0.1)

            except Exception as e:
                self.logger.error("Batch processing failed", error=str(e))
                self.metrics.record_error("batch_processing_error", "worker")
                await self.error_handler.handle_error(e, "batch_processing")
                await asyncio.sleep(1)  # Brief pause on error

        self.logger.info("Batch mode stopped")
        return 0

    async def _run_single_mode(self) -> int:
        """Run in single task processing mode."""
        self.logger.info("Running in single mode")

        while not self.shutdown_event.is_set():
            try:
                # Get single task
                task_data = await self.redis_client.get_single_task(timeout=5)

                if task_data:
                    task = task_data["task"]
                    task_id = task.get("id", "unknown")

                    self.logger.debug(
                        "Processing single task", task_id=task_id)

                    # Process single task with timing
                    with self.metrics.time_task_processing(task.get("taskType", "unknown")) as timer:
                        await self.batch_processor.process_batch([task])

                    self.metrics.record_task_processed(
                        task.get("taskType", "unknown"), "success")
                else:
                    # No task available
                    await asyncio.sleep(0.1)

            except Exception as e:
                self.logger.error(
                    "Single task processing failed", error=str(e))
                self.metrics.record_error("single_processing_error", "worker")
                await self.error_handler.handle_error(e, "single_processing")
                await asyncio.sleep(1)

        self.logger.info("Single mode stopped")
        return 0

    async def _run_hybrid_mode(self) -> int:
        """Run in hybrid mode (batch + single)."""
        self.logger.info("Running in hybrid mode")

        # Create tasks for both modes
        batch_task = asyncio.create_task(self._run_batch_mode())
        single_task = asyncio.create_task(self._run_single_mode())

        try:
            # Wait for either task to complete or shutdown
            done, pending = await asyncio.wait(
                [batch_task, single_task, self._wait_for_shutdown()],
                return_when=asyncio.FIRST_COMPLETED
            )

            # Cancel pending tasks
            for task in pending:
                task.cancel()

            # Wait for cancellation to complete
            await asyncio.gather(*pending, return_exceptions=True)

            # Return exit code from completed task
            for task in done:
                if not task.cancelled():
                    try:
                        return task.result()
                    except Exception as e:
                        self.logger.error("Task failed", error=str(e))
                        return 1

        except Exception as e:
            self.logger.error("Hybrid mode failed", error=str(e))
            return 1

        return 0

    async def _wait_for_shutdown(self):
        """Wait for shutdown event."""
        await self.shutdown_event.wait()

    async def _cleanup(self):
        """Cleanup resources."""
        self.running = False
        self.metrics.set_active_workers(0)

        if self.redis_client:
            await self.redis_client.close()
        if self.neo4j_client:
            await self.neo4j_client.close()

        self.logger.info("Worker cleanup completed")

#!/usr/bin/env python3
"""Error handler for graph refinement engine.

Why: Centralized error handling and recovery.
Why: Implement retry logic with exponential backoff.
Why: Support dead letter queues.
"""

import asyncio
from typing import Any, Dict, Optional

import structlog

from akigumo.graph_kernel.core.config import config
from akigumo.graph_kernel.core.metrics import MetricsCollector
from akigumo.graph_kernel.storage.redis_client import RedisClient


class ErrorHandler:
    """Handles errors and implements retry logic."""

    def __init__(self, redis_client: RedisClient, metrics: Optional[MetricsCollector] = None):
        self.logger = structlog.get_logger(__name__)
        self.redis_client = redis_client
        self.metrics = metrics or MetricsCollector()
        self.retry_queue = f"{config.redis_queue}:retry"
        self.dead_letter_queue = f"{config.redis_queue}:dead"

    async def handle_error(self, error: Exception, context: str, task: Optional[Dict[str, Any]] = None):
        """Handle an error with appropriate recovery strategy."""
        error_type = type(error).__name__

        self.logger.error(
            "Processing error",
            error=str(error),
            error_type=error_type,
            context=context,
            task_id=task.get('id') if task else None
        )

        self.metrics.record_error(error_type, context)

        if task and self._should_retry(task):
            await self._schedule_retry(task)
        elif task:
            await self._send_to_dead_letter_queue(task, error, context)

    def _should_retry(self, task: Dict[str, Any]) -> bool:
        """Determine if a task should be retried."""
        retry_count = task.get('retry_count', 0)
        return retry_count < config.max_retries

    async def _schedule_retry(self, task: Dict[str, Any]):
        """Schedule a task for retry with exponential backoff."""
        retry_count = task.get('retry_count', 0) + 1
        delay = 2 ** retry_count  # Exponential backoff

        task['retry_count'] = retry_count
        task['last_error'] = "Scheduled for retry"
        task['retry_at'] = asyncio.get_event_loop().time() + delay

        self.logger.info(
            "Scheduling retry",
            task_id=task.get('id'),
            retry_count=retry_count,
            delay=delay
        )

        # For simplicity, we'll use a delayed push
        # In production, you might want to use a proper job scheduler
        await self.redis_client.push_task(self.retry_queue, task)

    async def _send_to_dead_letter_queue(self, task: Dict[str, Any], error: Exception, context: str):
        """Send failed task to dead letter queue."""
        dead_letter_entry = {
            'task': task,
            'error': str(error),
            'error_type': type(error).__name__,
            'context': context,
            'failed_at': asyncio.get_event_loop().time(),
            'retry_count': task.get('retry_count', 0)
        }

        self.logger.warning(
            "Sending to dead letter queue",
            task_id=task.get('id'),
            error=str(error)
        )

        await self.redis_client.push_task(self.dead_letter_queue, dead_letter_entry)

    async def process_retry_queue(self):
        """Process tasks in the retry queue."""
        while True:
            try:
                task_data = await self.redis_client.get_single_task(queue=self.retry_queue, timeout=1)
                if not task_data:
                    break

                task = task_data['task']
                retry_at = task.get('retry_at', 0)
                current_time = asyncio.get_event_loop().time()

                if current_time >= retry_at:
                    # Ready for retry, move back to main queue
                    await self.redis_client.push_task(config.redis_queue, task)
                    self.logger.info(
                        "Task moved to main queue for retry", task_id=task.get('id'))
                else:
                    # Not ready yet, put back in retry queue
                    await self.redis_client.push_task(self.retry_queue, task)

            except Exception as e:
                self.logger.error("Error processing retry queue", error=str(e))
                await asyncio.sleep(1)

    async def get_dead_letter_stats(self) -> Dict[str, int]:
        """Get statistics about dead letter queue."""
        try:
            dead_count = await self.redis_client.get_queue_length(self.dead_letter_queue)
            retry_count = await self.redis_client.get_queue_length(self.retry_queue)
            return {
                'dead_letter_count': dead_count,
                'retry_count': retry_count
            }
        except Exception as e:
            self.logger.error("Failed to get dead letter stats", error=str(e))
            return {'dead_letter_count': 0, 'retry_count': 0}

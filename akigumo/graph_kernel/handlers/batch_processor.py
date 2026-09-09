#!/usr/bin/env python3
"""Batch processor for graph refinement tasks.

Why: Process multiple tasks efficiently.
Why: Use executors for direct processing and execution.
Why: Support atomic batch operations.
"""

import json
from collections import defaultdict
from typing import Any, Dict, List, Optional

import structlog

from akigumo.graph_kernel.core.metrics import MetricsCollector
from akigumo.graph_kernel.executors import load_executors
from akigumo.graph_kernel.storage.neo4j_client import Neo4jClient
from akigumo.infrastructure.message_queue import workflow_feedback_worker
from akigumo.infrastructure.message_queue.job import JobDict


class BatchProcessor:
    """Processes batches of graph refinement tasks."""

    def __init__(self, neo4j_client: Neo4jClient, metrics: Optional[MetricsCollector] = None):
        self.logger = structlog.get_logger(__name__)
        self.neo4j_client = neo4j_client
        self.metrics = metrics or MetricsCollector()

        self.feedback_worker = workflow_feedback_worker

        # Initialize executors
        self.executors = load_executors()

    async def process_batch(self, tasks: list[JobDict]):
        """Process a batch of tasks using executor-based handling."""
        if not tasks:
            return

        self.logger.debug("Processing batch", batch_size=len(tasks))
        print(f"Processing batch: {tasks}")

        # Extract task data from Redis messages
        tasks = [task["data"] for task in tasks]
        valid_tasks = self.validate_tasks(tasks)
        if not valid_tasks:
            self.logger.debug("No valid tasks to process")
            return

        try:
            # Process tasks with executors
            await self._process_with_executors(valid_tasks)

            feedback = [json.dumps({
                "version": "1.0.0",
                "workflowId": task["id"],
                "sender": {
                    "action": "PYTHON"
                },
                "status": {
                    "status": "SUCCESS"
                }
            }) for task in valid_tasks]

            await self.feedback_worker.add_batch(feedback)

            self.logger.debug("Batch processed successfully",
                              batch_size=len(tasks))

        except Exception as e:
            feedback = [json.dumps({
                "version": "1.0.0",
                "workflowId": task["id"],
                "sender": {
                    "action": "PYTHON"
                },
                "status": {
                    "status": "FAILURE",
                    "error": str(e)
                }
            }) for task in valid_tasks]

            await self.feedback_worker.add_batch(feedback)

            self.logger.error("Batch processing failed",
                              error=str(e), batch_size=len(tasks))
            self.metrics.record_error("batch_processing", "batch_processor")
            raise

    async def _process_with_executors(self, tasks: List[Dict[str, Any]]):
        """Process tasks using executors."""
        # Group tasks by type
        task_groups = defaultdict(list)
        for task in tasks:
            task_type = task.get("taskType")
            task_payload = task.get("taskPayload", {})
            if isinstance(task_payload, list):
                task_groups[task_type].extend(task_payload)
            else:
                task_groups[task_type].append(task_payload)

        # Process each group with appropriate executor
        for task_type, task_list in task_groups.items():
            executor = self.executors.get(task_type)
            if executor:
                # Execute with executor (logic processing is now in executor)
                await executor.execute(self.neo4j_client, task_list)
            else:
                self.logger.warning(
                    "No executor found for task type", task_type=task_type)

    async def process_single_task(self, task: Dict[str, Any]):
        """Process a single task."""
        await self.process_batch([task])
        """Process a single task."""
        await self.process_batch([task])

    def validate_tasks(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate tasks before processing."""
        valid_tasks = []

        for task in tasks:
            if self._is_valid_task(task):
                valid_tasks.append(task)
            else:
                self.logger.warning("Invalid task", task=task)
                self.metrics.record_task_failed(
                    task.get("taskType", "unknown"), "validation")

        return valid_tasks

    def _is_valid_task(self, task: Dict[str, Any]) -> bool:
        """Validate a single task."""
        required = ["taskVersion", "taskType"]

        # Check required fields
        if not all(task.get(key) for key in required):
            return False

        # Check task version
        if task.get("taskVersion") != 1:
            return False

        return True

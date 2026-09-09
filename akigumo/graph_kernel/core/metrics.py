#!/usr/bin/env python3
"""Metrics collection for graph refinement engine.

Why: Enable monitoring and observability.
Why: Track performance and error rates.
Why: Support alerting and dashboards.
"""

import time
from typing import Optional

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram

from akigumo.graph_kernel.core.config import config


class MetricsCollector:
    """Collects and exposes metrics for monitoring."""

    def __init__(self, registry: Optional[CollectorRegistry] = None):
        self.registry = registry or CollectorRegistry()

        # Task processing metrics
        self.tasks_processed = Counter(
            'graph_refinement_tasks_total',
            'Total tasks processed',
            ['task_type', 'status'],
            registry=self.registry
        )

        self.tasks_failed = Counter(
            'graph_refinement_tasks_failed_total',
            'Total tasks failed',
            ['task_type', 'error_type'],
            registry=self.registry
        )

        # Processing time metrics
        self.processing_time = Histogram(
            'graph_refinement_processing_duration_seconds',
            'Task processing duration in seconds',
            ['task_type'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
            registry=self.registry
        )

        # Batch metrics
        self.batch_size = Histogram(
            'graph_refinement_batch_size',
            'Batch size distribution',
            buckets=[1, 10, 50, 100, 200, 500],
            registry=self.registry
        )

        self.batch_processing_time = Histogram(
            'graph_refinement_batch_processing_duration_seconds',
            'Batch processing duration in seconds',
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
            registry=self.registry
        )

        # Queue metrics
        self.queue_size = Gauge(
            'graph_refinement_queue_size',
            'Current queue size',
            registry=self.registry
        )

        # Worker metrics
        self.active_workers = Gauge(
            'graph_refinement_active_workers',
            'Number of active workers',
            registry=self.registry
        )

        # Error metrics
        self.errors = Counter(
            'graph_refinement_errors_total',
            'Total errors by type',
            ['error_type', 'component'],
            registry=self.registry
        )

        # Connection metrics
        self.redis_connection_errors = Counter(
            'graph_refinement_redis_connection_errors_total',
            'Redis connection errors',
            registry=self.registry
        )

        self.neo4j_connection_errors = Counter(
            'graph_refinement_neo4j_connection_errors_total',
            'Neo4j connection errors',
            registry=self.registry
        )

    def record_task_processed(self, task_type: str, status: str = 'success'):
        """Record a processed task."""
        if config.enable_metrics:
            self.tasks_processed.labels(
                task_type=task_type, status=status).inc()

    def record_task_failed(self, task_type: str, error_type: str = 'unknown'):
        """Record a failed task."""
        if config.enable_metrics:
            self.tasks_failed.labels(
                task_type=task_type, error_type=error_type).inc()

    def record_processing_time(self, task_type: str, duration: float):
        """Record task processing duration."""
        if config.enable_metrics:
            self.processing_time.labels(task_type=task_type).observe(duration)

    def record_batch_processed(self, batch_size: int, duration: float):
        """Record batch processing metrics."""
        if config.enable_metrics:
            self.batch_size.observe(batch_size)
            self.batch_processing_time.observe(duration)

    def update_queue_size(self, size: int):
        """Update current queue size."""
        if config.enable_metrics:
            self.queue_size.set(size)

    def set_active_workers(self, count: int):
        """Set number of active workers."""
        if config.enable_metrics:
            self.active_workers.set(count)

    def record_error(self, error_type: str, component: str = 'unknown'):
        """Record an error."""
        if config.enable_metrics:
            self.errors.labels(error_type=error_type,
                               component=component).inc()

    def record_redis_error(self):
        """Record Redis connection error."""
        if config.enable_metrics:
            self.redis_connection_errors.inc()

    def record_neo4j_error(self):
        """Record Neo4j connection error."""
        if config.enable_metrics:
            self.neo4j_connection_errors.inc()

    def time_task_processing(self, task_type: str):
        """Context manager to time task processing."""
        return _Timer(self.processing_time.labels(task_type=task_type))

    def time_batch_processing(self):
        """Context manager to time batch processing."""
        return _Timer(self.batch_processing_time)


class _Timer:
    """Simple timer context manager."""

    def __init__(self, histogram):
        self.histogram = histogram
        self.start_time = None
        self.duration = 0.0

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time is not None:
            self.duration = time.time() - self.start_time
            self.histogram.observe(self.duration)

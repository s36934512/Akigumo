#!/usr/bin/env python3
"""Command line interface for graph refinement engine.

Why: Provide easy-to-use CLI for different operations.
Why: Support different worker modes and management commands.
Why: Enable health checks and diagnostics.
"""

import asyncio
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import click

from akigumo.graph_kernel.core.config import config as app_config
from akigumo.graph_kernel.core.health import HealthChecker
from akigumo.graph_kernel.core.worker import GraphRefinementWorker
from akigumo.graph_kernel.handlers.error_handler import ErrorHandler
from akigumo.graph_kernel.storage.redis_client import RedisClient

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))


@click.group()
@click.option('--config-file', help='Path to configuration file')
@click.pass_context
def cli(ctx: click.Context, config_file: Optional[str]):
    """Graph Refinement Engine CLI"""
    ctx.ensure_object(dict)
    ctx.obj['config_file'] = config_file


@cli.command()
@click.option('--mode', default='batch',
              type=click.Choice(['batch', 'single', 'hybrid']),
              help='Worker processing mode')
@click.option('--log-level', default='INFO',
              type=click.Choice(['DEBUG', 'INFO', 'WARNING', 'ERROR']),
              help='Logging level')
def start(mode: str, log_level: str):
    """Start the graph refinement worker."""
    # Override configuration
    import os
    os.environ['GRAPH_WORKER_MODE'] = mode
    os.environ['GRAPH_LOG_LEVEL'] = log_level

    click.echo(f"Starting worker in {mode} mode with log level {log_level}")

    try:
        worker = GraphRefinementWorker()
        exit_code = asyncio.run(worker.start())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        click.echo("\nShutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
def health():
    """Check system health."""
    async def check():
        checker = HealthChecker()
        result = await checker.check()

        if result['status'] == 'healthy':
            click.echo("✅ System is healthy")
            click.echo(f"Timestamp: {result['timestamp']}")
        else:
            click.echo("❌ System has issues")
            for component, status in result['checks'].items():
                if status['status'] == 'unhealthy':
                    click.echo(
                        f"  - {component}: {status.get('error', 'Unknown error')}")
            sys.exit(1)

    asyncio.run(check())


@cli.command()
@click.option('--queue', default=app_config.redis_queue, help='Queue name')
def stats(queue: str):
    """Show queue statistics."""
    async def show_stats():
        try:
            redis_client = RedisClient()
            await redis_client.connect()

            queue_length = await redis_client.get_queue_length(queue)
            retry_length = await redis_client.get_queue_length(f"{queue}:retry")
            dead_length = await redis_client.get_queue_length(f"{queue}:dead")

            click.echo(f"Queue Statistics for '{queue}':")
            click.echo(f"  Main queue: {queue_length} tasks")
            click.echo(f"  Retry queue: {retry_length} tasks")
            click.echo(f"  Dead letter queue: {dead_length} tasks")

            await redis_client.close()

        except Exception as e:
            click.echo(f"Error getting stats: {e}", err=True)
            sys.exit(1)

    asyncio.run(show_stats())


@cli.command()
@click.option('--queue', default=app_config.redis_queue, help='Queue name')
@click.confirmation_option(prompt='Are you sure you want to clear the queues?')
def clear_queues(queue: str):
    """Clear all queues (dangerous operation)."""
    async def clear():
        try:
            redis_client = RedisClient()
            await redis_client.connect()

            main_cleared = await redis_client.clear_queue(queue)
            retry_cleared = await redis_client.clear_queue(f"{queue}:retry")
            dead_cleared = await redis_client.clear_queue(f"{queue}:dead")

            click.echo("Queues cleared:")
            click.echo(f"  Main queue: {main_cleared} tasks removed")
            click.echo(f"  Retry queue: {retry_cleared} tasks removed")
            click.echo(f"  Dead letter queue: {dead_cleared} tasks removed")

            await redis_client.close()

        except Exception as e:
            click.echo(f"Error clearing queues: {e}", err=True)
            sys.exit(1)

    asyncio.run(clear())


@cli.command()
@click.argument('task_file', type=click.Path(exists=True))
@click.option('--validate-only', is_flag=True, help='Only validate, do not process')
def process_file(task_file: str, validate_only: bool):
    """Process tasks from a JSON file."""
    import json

    async def process(task: Dict[str, Any]):
        redis_client = RedisClient()
        print(await redis_client.push_task(app_config.redis_queue, task))

    try:
        with open(task_file, 'r') as f:
            tasks = json.load(f)

        if not isinstance(tasks, list):
            tasks = [tasks]

        click.echo(f"Loaded {len(tasks)} tasks from {task_file}")

        if validate_only:
            # Import here to avoid circular imports
            from akigumo.graph_kernel.handlers.batch_processor import BatchProcessor
            processor = BatchProcessor(None)  # No neo4j client for validation
            valid_tasks = processor.validate_tasks(tasks)
            click.echo(f"Validated {len(valid_tasks)} tasks")
            for i, task in enumerate(valid_tasks, 1):
                click.echo(
                    f"  {i}. {task.get('taskType')} - {task.get('fileId')}")
        else:
            click.echo("Processing tasks...")
            for task in tasks:
                asyncio.run(process(task))

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@cli.command()
def config():
    """Show current configuration."""
    click.echo("Current Configuration:")
    click.echo(f"  Worker Mode: {app_config.worker_mode}")
    click.echo(f"  Batch Size: {app_config.batch_size}")
    click.echo(f"  Batch Timeout: {app_config.batch_timeout_ms}ms")
    click.echo(f"  Max Retries: {app_config.max_retries}")
    click.echo(
        f"  Redis: {app_config.redis_host}:{app_config.redis_port}/{app_config.redis_db}")
    click.echo(f"  Queue: {app_config.redis_queue}")
    click.echo(f"  Neo4j: {app_config.neo4j_uri}")
    click.echo(f"  Enable Mentions: {app_config.enable_file_tag_mentions}")
    click.echo(f"  Enable Metrics: {app_config.enable_metrics}")
    click.echo(f"  Log Level: {app_config.log_level}")


if __name__ == '__main__':
    cli()

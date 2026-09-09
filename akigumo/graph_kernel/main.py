#!/usr/bin/env python3
"""Main entry point for graph refinement engine.

Why: Single entry point for all worker modes.
Why: Support CLI interface with proper argument parsing.
Why: Enable graceful shutdown and proper logging setup.
"""

import asyncio
import sys

from akigumo.graph_kernel.core.config import config
from akigumo.graph_kernel.core.worker import GraphRefinementWorker


def setup_logging():
    """Setup structured logging."""
    import logging

    import structlog

    # Configure standard logging
    level_name = config.log_level.upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    # Configure Neo4j logging
    neo4j_level_name = config.neo4j_log_level.upper()
    neo4j_level = getattr(logging, neo4j_level_name, logging.WARNING)
    logging.getLogger("neo4j").setLevel(neo4j_level)

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def main() -> int:
    """Main entry point."""
    setup_logging()

    try:
        # Create and run worker
        worker = GraphRefinementWorker()
        exit_code = asyncio.run(worker.start())
        return exit_code

    except KeyboardInterrupt:
        print("\nReceived keyboard interrupt, shutting down...")
        return 0
    except Exception as e:
        print(f"Fatal error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

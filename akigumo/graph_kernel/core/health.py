#!/usr/bin/env python3
"""Health checks for graph refinement engine.

Why: Enable service discovery and load balancing.
Why: Monitor component health.
Why: Support graceful shutdown.
"""

import asyncio
import time
from typing import Any, Dict

from akigumo.graph_kernel.core.config import config


class HealthChecker:
    """Performs health checks on all components."""

    def __init__(self):
        self.last_check = 0
        self.check_interval = 30  # seconds
        self._cached_result = None

    async def check(self) -> Dict[str, Any]:
        """Perform comprehensive health check."""
        current_time = time.time()

        # Use cached result if recent
        if current_time - self.last_check < self.check_interval and self._cached_result:
            return self._cached_result

        health_status = {
            "status": "healthy",
            "timestamp": current_time,
            "checks": {}
        }

        # Check all components
        checks = await asyncio.gather(
            self._check_redis(),
            self._check_neo4j(),
            self._check_config(),
            return_exceptions=True
        )

        check_names = ["redis", "neo4j", "config"]

        for name, result in zip(check_names, checks):
            if isinstance(result, Exception):
                health_status["checks"][name] = {
                    "status": "unhealthy",
                    "error": str(result)
                }
                health_status["status"] = "unhealthy"
            else:
                health_status["checks"][name] = result
                if result.get("status") == "unhealthy":
                    health_status["status"] = "unhealthy"

        self._cached_result = health_status
        self.last_check = current_time

        return health_status

    async def _check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity."""
        try:
            # Import here to avoid circular imports
            from akigumo.graph_kernel.storage.redis_client import RedisClient

            client = RedisClient()
            # Simple ping test
            pong = await client.client.ping()
            if pong:
                return {
                    "status": "healthy",
                    "response_time": 0.0,
                    "details": "Redis connection OK"
                }
            else:
                return {
                    "status": "unhealthy",
                    "details": "Redis ping failed"
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def _check_neo4j(self) -> Dict[str, Any]:
        """Check Neo4j connectivity."""
        try:
            # Import here to avoid circular imports
            from akigumo.graph_kernel.storage.neo4j_client import Neo4jClient

            client = Neo4jClient()
            await client.connect()
            # Simple connectivity test
            result = await client.verify_connectivity()
            if result:
                return {
                    "status": "healthy",
                    "response_time": 0.0,
                    "details": "Neo4j connection OK"
                }
            else:
                return {
                    "status": "unhealthy",
                    "details": "Neo4j connectivity check failed"
                }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    async def _check_config(self) -> Dict[str, Any]:
        """Check configuration validity."""
        try:
            # Validate required configuration
            required_fields = ['neo4j_uri', 'neo4j_username', 'neo4j_password']

            missing = []
            for field in required_fields:
                value = getattr(config, field)
                if not value:
                    missing.append(field)

            if missing:
                return {
                    "status": "unhealthy",
                    "details": f"Missing required configuration: {', '.join(missing)}"
                }

            return {
                "status": "healthy",
                "details": "Configuration valid"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    def is_healthy(self) -> bool:
        """Quick health check."""
        if not self._cached_result:
            return False
        return self._cached_result.get("status") == "healthy"

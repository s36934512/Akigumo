#!/usr/bin/env python3
"""Unified configuration management for graph refinement engine.

Why: Centralize all configuration with validation.
Why: Support environment variables with defaults.
Why: Enable runtime configuration validation.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict


# Find .env file in project root
def _find_env_file() -> Optional[Path]:
    """Find .env file by traversing up from current file."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        env_file = parent / ".env"
        if env_file.exists():
            return env_file
    return None


class GraphRefinementConfig(BaseSettings):
    """Configuration for graph refinement engine."""

    # Redis configuration
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0
    redis_queue: str = "graph_tasks"

    # Neo4j configuration
    neo4j_uri: Optional[str] = None
    neo4j_username: Optional[str] = None
    neo4j_password: Optional[str] = None

    # Worker configuration
    worker_mode: str = "batch"  # batch, single, hybrid
    batch_size: int = 100
    batch_timeout_ms: int = 200
    max_retries: int = 3

    # Feature flags
    enable_file_tag_mentions: bool = False
    enable_metrics: bool = True

    # Resource limits
    max_text_bytes: int = 128 * 1024
    max_tags: int = 30

    # Logging
    log_level: str = "INFO"
    neo4j_log_level: str = "WARNING"

    model_config = ConfigDict(
        env_file=_find_env_file(),
        env_file_encoding="utf-8",
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator('worker_mode')
    def validate_worker_mode(cls, v):
        """Validate worker mode."""
        if v not in ['batch', 'single', 'hybrid']:
            raise ValueError(f'Invalid worker mode: {v}')
        return v

    @field_validator('batch_size')
    def validate_batch_size(cls, v):
        """Validate batch size."""
        if v < 1 or v > 1000:
            raise ValueError(f'Batch size must be between 1 and 1000, got {v}')
        return v

    @field_validator('neo4j_uri', 'neo4j_username', 'neo4j_password')
    def validate_neo4j_config(cls, v, info):
        """Validate Neo4j configuration."""
        if not v:
            raise ValueError(f'{info.field_name} is required')
        return v


# Global configuration instance
config = GraphRefinementConfig()

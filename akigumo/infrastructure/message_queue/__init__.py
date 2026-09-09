#!/usr/bin/env python3
"""Core module for messaging engine."""
import os

import yaml

from .job import JobDict, Jobs
from .queue import MessageQueue
from .redis import RedisConnection
from .worker import BatchWorker

__version__ = "1.0.0"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "config.yaml")

with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)

graph_refinement_worker = BatchWorker(
    name=config['mq']["graph_stream_name"],
    group=config['mq']["graph_group_name"],
)

workflow_feedback_worker = BatchWorker(
    name=config['mq']["workflow_stream_name"],
    group=config['mq']["workflow_group_name"],
)

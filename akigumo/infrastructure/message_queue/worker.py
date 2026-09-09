import asyncio
import logging
import os
from typing import Callable

import yaml
from redis.asyncio.client import Pipeline

from akigumo.infrastructure.message_queue.redis import RedisConnection

from .job import JobDict, Jobs
from .queue import MessageQueue

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "config.yaml")

with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)


class BatchWorker(MessageQueue):
    def __init__(
        self,
        name: str,
        group: str,
        connection: RedisConnection = None,
        trim_interval_seconds: int = config['mq']['trim_interval_seconds'],
        batch_size: int = config['mq']['batch_size'],
        min_idle_time: int = config['mq']['min_idle_time'],
    ):
        super().__init__(
            name=name,
            group=group,
            trim_interval_seconds=trim_interval_seconds,
            connection=connection
        )
        self.worker_name = f"worker-{os.getpid()}"
        self.batch_size = batch_size
        self.min_idle_time = min_idle_time
        self.running = False

    async def _handle_batch(
        self,
        messages: list[tuple],
        handler: Callable[[list[JobDict]], None]
    ):
        """處理一批訊息並批次 ACK"""
        if not messages:
            return

        jobs = Jobs(messages).get_jobs()

        try:
            await handler(jobs)

            # 使用 Pipeline 批次執行 XACK，減少網路延遲
            async with self.redis.pipeline(transaction=False) as pipe:
                pipe: Pipeline

                for job in jobs:
                    pipe.xack(self.name, self.group, job["id"])

                await pipe.execute()

            logger.debug(
                f"Successfully processed and ACKed batch of {len(jobs)}")
        except Exception as e:
            logger.exception(f"Batch processing failed: {e}")
            # 注意：這裡不 XACK，這些任務會留在 PEL 中，等待下次 XAUTOCLAIM 重新處理

    async def run(self, handler: Callable[[list[JobDict]], None]):
        """啟動批次 Worker 迴圈"""
        await self.setup()
        self.running = True
        logger.info(
            f"Batch Worker {self.name} started (batch_size={self.batch_size})...")

        while self.running:
            try:
                # 1. 檢查並處理 Stale Jobs (遺漏任務)
                # XAUTOCLAIM 同樣支援批次領取
                _, stale_messages, _ = await self.redis.xautoclaim(
                    name=self.name,
                    groupname=self.group,
                    consumername=self.worker_name,
                    min_idle_time=self.min_idle_time,
                    start_id="0-0",
                    count=self.batch_size
                )
                if stale_messages:
                    await self._handle_batch(stale_messages, handler)

                # 2. 讀取新的一批任務
                # 這裡的 count 設為 batch_size
                response = await self.redis.xreadgroup(
                    groupname=self.group,
                    consumername=self.worker_name,
                    streams={self.name: ">"},
                    count=self.batch_size,
                    block=2000
                )

                if response:
                    for _, msgs in response:
                        await self._handle_batch(msgs, handler)

            except Exception as e:
                logger.error(f"Worker Loop Error: {e}")
                await asyncio.sleep(1)

    async def stop(self):
        self.running = False
        await self.close()

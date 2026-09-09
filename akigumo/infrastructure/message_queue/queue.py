import asyncio
import os
from typing import Optional

import yaml
from redis import Redis, ResponseError
from redis.asyncio.client import Pipeline

from .redis import RedisConnection

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "config.yaml")

with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)


class MessageQueue:
    def __init__(
        self,
        name: str,
        group: str,
        connection: RedisConnection = None,
        trim_interval_seconds: int = config['mq']['trim_interval_seconds'],
    ):
        self.name = name
        self.group = group
        self.trim_interval_seconds = trim_interval_seconds
        self.redis: Redis = (connection or RedisConnection()).get()
        self._trim_task: Optional[asyncio.Task] = None

    async def setup(self):
        try:
            await self.redis.xgroup_create(self.name, self.group, id="0", mkstream=True)
        except ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise

        self._trim_task = asyncio.create_task(self.safe_trim_loop())

    async def safe_trim_loop(self):
        while True:
            try:
                if self.redis:
                    pending_info = await self.redis.xpending(self.name, self.group)
                    min_pending_id = pending_info.get('min')

                    if min_pending_id:
                        # 採用 MINID + 模糊修剪 (~)，不刪除未 ACK 數據，不阻塞 Redis
                        await self.redis.xtrim(self.name, minid=min_pending_id, approximate=True)
            except Exception as e:
                # 5. 注意：後台循環必須捕獲所有異常，防止因為單次網路波動導致整個清理線程死掉
                print(f"安全修剪循環發生異常: {e}")

            await asyncio.sleep(self.trim_interval_seconds)

    async def add(self, data: str):
        if not self.redis:
            raise RuntimeError("Redis connection is not established.")
        await self.redis.xadd(self.name, {"payload": data})

    async def add_batch(self, data: list[str]):
        if not self.redis:
            raise RuntimeError("Redis connection is not established.")

        async with self.redis.pipeline(transaction=False) as pipe:
            pipe: Pipeline

            for d in data:
                await self.redis.xadd(self.name, {"payload": d})

            await pipe.execute()

    async def close(self):
        if self._trim_task:
            self._trim_task.cancel()
            try:
                await self._trim_task
            except asyncio.CancelledError:
                pass
        if self.redis:
            await self.redis.close()

import os

from redis.asyncio import Redis
import yaml

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "config.yaml")

with open(config_path, "r", encoding="utf-8") as f:
    config = yaml.safe_load(f)


class RedisConnection:
    def __init__(
        self,
        host: str = config['redis']['host'],
        port: int = config['redis']['port']
    ):
        self.redis = Redis.from_url(
            f"redis://{host}:{port}", decode_responses=True)

    def get(self) -> Redis:
        return self.redis

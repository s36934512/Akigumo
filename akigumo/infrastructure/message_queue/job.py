import json
from typing import TypedDict


class JobDict(TypedDict):
    id: str
    data: dict


class Jobs:
    def __init__(self, messages: list[tuple]):
        self.messages = messages

    def get_jobs(self) -> list[JobDict]:
        return [{"id": str(msg_id), "data": self._decode_message(data)} for msg_id, data in self.messages]

    def _decode_message(self, msg: dict) -> dict:
        # Redis Streams 的消息格式是 {field1: value1, field2: value2, ...}
        # 這裡假設每條消息只有一個字段，且該字段的值是 JSON 字符串
        value = next(iter(msg.values()))
        return json.loads(value)

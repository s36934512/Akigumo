from abc import ABC, abstractmethod

import structlog


class BaseExecutor(ABC):
    REQUIRED_IDENTITY = []  # 由子類定義

    @property
    @abstractmethod
    def template(self) -> str:
        pass

    @classmethod
    async def execute(cls, db, batch):
        logger = structlog.get_logger(__name__)
        safe_batch = [
            d for d in batch
            if all(key in d and d[key] is not None for key in cls.REQUIRED_IDENTITY)
        ]

        if not safe_batch:
            # print 可以換成標準 logging
            logger.debug(f"[{cls.__name__}] 跳過：無效資料 (原大小: {len(batch)})")
            return

        try:
            await db.execute_write_query(cls().template, {"batch": safe_batch})
            print(f"[{cls.__name__}] 成功處理 {len(safe_batch)} 筆資料")
        except Exception as e:
            print(f"[{cls.__name__}] 執行失敗: {e}")

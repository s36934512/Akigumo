from akigumo.graph_kernel.executors.base import GenericNodeBase


class ItemExecutor(GenericNodeBase):
    TASK_TYPES = ["ITEM_REGISTRY"]
    REQUIRED_IDENTITY = ["itemId", "childrenIds"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS data
        {self._merge_item}
        WITH i, data.childrenIds AS childList
        UNWIND childList AS childId
        MATCH (c:Item {{id: childId}})
        MERGE (i)-[:CONTAINS]->(c)
        """

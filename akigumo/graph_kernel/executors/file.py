from typing import Any, Dict

from akigumo.graph_kernel.executors.base import GenericNodeBase


class FileExecutor(GenericNodeBase):
    TASK_TYPES = ["FILE_REGISTRY"]
    REQUIRED_IDENTITY = ["fileId", "itemId"]

    def process_logic(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply processing logic for file graph."""
        if data.get("rank") == "Senior":
            data["action"] = "DIRECT_ASSIGN"
        elif data.get("markLogicalOnly"):
            data["action"] = "GHOST_NODE"
        return data

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS data
        {self._merge_file}
        {self._merge_file_container}
        MERGE (i)-[:CONTAINS]->(f)
        MERGE (i)-[:DISPLAY_AS]->(f)
        """


# class DerivationFoldRule(GenericNodeBase):
#     """Rule for FOLD_DERIVATION_PATH tasks."""

#     steps = [
#         {"label": "File", "rel": "DERIVED_FROM", "key": "sourceFileId"},
#         {"label": "File", "rel": "VERSION_OF", "key": "originalSourceId"}
#     ]

#     def process_logic(self, data: Dict[str, Any]) -> Dict[str, Any]:
#         """Apply folding logic for derivation paths."""
#         if data.get("lineageRelation") == "VERSION_OF" and data.get("rank"):
#             data["action"] = "COLLAPSE_CHAIN"
#         else:
#             data["action"] = "PRESERVE_CHAIN"
#         return data

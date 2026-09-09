from akigumo.graph_kernel.executors.base import GenericNodeBase


class UserExecutor(GenericNodeBase):
    REQUIRED_IDuser = ["userId"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS data
        {self._merge_user}
        """

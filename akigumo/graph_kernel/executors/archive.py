from akigumo.graph_kernel.executors.base import GenericNodeBase


class ArchiveExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ["originalFileId", "fileId"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS data
        MATCH (i)-[:CONTAINS]->(of:File)
        WHERE of.id = data.originalFileId
        SET of.updatedTime = datetime()
        SET of += data.originalFileProps

        {self._merge_file}
        MERGE (i)-[:CONTAINS]->(f)
        MERGE (i)-[:DISPLAY_AS]->(f)
        MERGE (of)-[:DERIVED]->(f)
        
        WITH of
        OPTIONAL MATCH ()-[r:DISPLAY_AS]->(of)
        DELETE r
        """


class ArchiveUncompressExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ["fileId", "itemId", "childrenFileIds"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS data
        MATCH (if:Item:FileContainer)-[:CONTAINS]->(f:File)
        WHERE f.id = data.fileId
        SET of += data.fileProps

        {self._merge_work}
        MERGE (i)-[:SOURCE_OF]->(if)

        WITH i, data.childrenFileIds AS childList
        UNWIND childList AS childId
        MATCH (c:Item {{id: childId}})
        MERGE (i)-[:CONTAINS]->(c)
        """


class ArchiveConceptExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = []

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS group

        CALL (group) {{
            UNWIND coalesce(group.pool, []) AS data
            {self._merge_concept}
        }}

        UNWIND coalesce(group.taskList, []) AS task

        MATCH (i:Item {{id: task.targetId}})
        MATCH (v:Concept {{id: task.keyId}})
   
        CREATE (s:Statement {{type: task.keyType}})
        SET s.createdTime = datetime()

        CREATE (i)-[:WITH]->(s)-[:ABOUT_KEY]->(v)

        WITH s, task
        UNWIND coalesce(task.values, []) AS valId
        MATCH (c:Concept {{id: valId}})
        MERGE (s)-[:WITH]->(c)
        """


class ArchiveDeleteExecutor(GenericNodeBase):
    REQUIRED_IDENTITY = ["archiveId"]

    @property
    def template(self) -> str:
        return f"""
        UNWIND $batch AS data
        MATCH (i:Item {{id: data.archiveId}})
        SET i:Delete
        """

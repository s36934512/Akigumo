from akigumo.graph_kernel.core.executor import BaseExecutor


class GenericNodeBase(BaseExecutor):
    """
    通用型基底，子類別只需要定義 LABEL, IDENTITY_KEY, 
    以及對應資料內的 DATA_KEY
    """
    LABEL = ""
    IDENTITY_KEY = ""  # Neo4j 裡的屬性名
    DATA_KEY = ""      # Input dict 裡的鍵名

    @property
    def REQUIRED_IDENTITY(self):
        return [self.DATA_KEY]

    @property
    def _merge_file(self):
        return """
        MERGE (f:File {id: data.fileId})
        ON CREATE SET f.createdTime = datetime()
        ON MATCH SET f.updatedTime = datetime()
        SET f += data.fileProps
        """

    @property
    def _merge_item(self) -> str:
        return """
        MERGE (i:Item {id: data.itemId})
        ON CREATE SET i.createdTime = datetime()
        ON MATCH SET i.updatedTime = datetime()
        SET i += data.itemProps
        """

    @property
    def _merge_work(self) -> str:
        return """
        MERGE (i:Item:Work {id: data.itemId})
        ON CREATE SET i.createdTime = datetime()
        ON MATCH SET i.updatedTime = datetime()
        SET i += data.itemProps
        """

    @property
    def _merge_file_container(self) -> str:
        return """
        MERGE (i:Item:FileContainer {id: data.itemId})
        ON CREATE SET i.createdTime = datetime()
        ON MATCH SET i.updatedTime = datetime()
        SET i += data.itemProps
        """

    @property
    def _merge_concept(self) -> str:
        return """
        MERGE (e:Concept {id: data.conceptId})
        ON CREATE SET e.createdTime = datetime()
        ON MATCH SET e.updatedTime = datetime()
        SET e += data.conceptProps
        """

    @property
    def _merge_user(self) -> str:
        return """
        MERGE (u:User {id: data.userId})
        ON CREATE SET u.createdTime = datetime()
        ON MATCH SET u.updatedTime = datetime()
        SET u += data.userProps
        """

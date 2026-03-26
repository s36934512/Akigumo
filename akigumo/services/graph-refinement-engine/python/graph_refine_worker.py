#!/usr/bin/env python3
"""Independent worker for file graph refinement.

This process consumes jobs from Redis list and applies idempotent Cypher updates
for classification, optional keyword mentions, and duplicate linking.
"""

import json
import logging
import os
import re
import signal
import sys
import time
from pathlib import Path
from typing import Any, Iterable

import redis
from neo4j import GraphDatabase

LOGGER = logging.getLogger("graph_refine_worker")

GRAPH_TASK_QUEUE = os.getenv("FILE_GRAPH_TASK_QUEUE", "graph_tasks")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
ENABLE_FILE_TAG_MENTIONS = os.getenv(
    "ENABLE_FILE_TAG_MENTIONS", "false").lower() == "true"

MAX_TEXT_BYTES = 128 * 1024
MAX_TAGS = 30
TASK_VERSION = 1
TASK_TYPE_UPSERT = "UPSERT_FILE_GRAPH"
TASK_TYPE_FOLD = "FOLD_DERIVATION_PATH"
STOP = False


def setup_logging() -> None:
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )
    neo4j_notice_level_name = os.getenv(
        "NEO4J_NOTIFICATION_LOG_LEVEL", "WARNING").upper()
    neo4j_notice_level = getattr(
        logging, neo4j_notice_level_name, logging.WARNING)
    logging.getLogger("neo4j.notifications").setLevel(neo4j_notice_level)


def signal_handler(signum, _frame):
    global STOP
    LOGGER.info("Received signal %s, shutting down.", signum)
    STOP = True


def normalize_extension(task: dict) -> str:
    extension = (task.get("extension") or "").strip().lower().lstrip(".")
    if extension:
        return extension

    original_name = task.get("originalName") or ""
    suffix = Path(original_name).suffix.lower().lstrip(".")
    return suffix


def extract_tags(physical_path: str | None) -> list[str]:
    if not physical_path:
        return []

    path = Path(physical_path)
    if not path.exists() or not path.is_file():
        return []

    try:
        raw = path.read_bytes()[:MAX_TEXT_BYTES]
        text = raw.decode("utf-8", errors="ignore")
    except OSError:
        return []

    words = re.findall(r"[A-Za-z0-9_]{3,}", text)
    seen = set()
    tags: list[str] = []

    for word in words:
        normalized = word.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        tags.append(normalized)
        if len(tags) >= MAX_TAGS:
            break

    return tags


def resolve_storage_status(task: dict) -> str | None:
    if bool(task.get("markLogicalOnly")):
        return "logical_only"

    physical_path = task.get("physicalPath")
    if not physical_path:
        return None

    path = Path(physical_path)
    if path.exists() and path.is_file():
        return "on_disk"

    return "logical_only"


def ensure_constraints_and_indexes(tx) -> None:
    tx.run(
        """
        CREATE CONSTRAINT file_id_unique IF NOT EXISTS
        FOR (f:File)
        REQUIRE f.id IS UNIQUE
        """
    )

    tx.run(
        """
        CREATE INDEX file_checksum_idx IF NOT EXISTS
        FOR (f:File)
        ON (f.checksum)
        """
    )


def initialize_graph_schema(driver) -> None:
    with driver.session() as session:
        session.execute_write(ensure_constraints_and_indexes)

    LOGGER.info(
        "Neo4j schema ensured: File(id) constraint and File(checksum) index")


def merge_file_and_extension(tx, task: dict) -> None:
    file_id = task["fileId"]
    original_name = task.get("originalName")
    checksum = task.get("checksum")
    storage_status = resolve_storage_status(task)
    extension = normalize_extension(task)

    tx.run(
        """
        MERGE (f:File {id: $file_id})
        ON CREATE SET f.createdTime = datetime()
        SET f.name = coalesce($original_name, f.name),
            f.checksum = coalesce($checksum, f.checksum),
            f.storageStatus = coalesce($storage_status, f.storageStatus, 'on_disk'),
            f.updatedTime = datetime()
        """,
        file_id=file_id,
        original_name=original_name,
        checksum=checksum,
        storage_status=storage_status,
    )

    if storage_status == "logical_only":
        tx.run(
            """
            MATCH (f:File {id: $file_id})
            SET f:Ghost
            """,
            file_id=file_id,
        )
    elif storage_status == "on_disk":
        tx.run(
            """
            MATCH (f:File {id: $file_id})
            REMOVE f:Ghost
            """,
            file_id=file_id,
        )

    if extension:
        tx.run(
            """
            MATCH (f:File {id: $file_id})
            MERGE (e:Ext:Entity {name: $extension})
            MERGE (f)-[:TYPE]->(e)
            """,
            file_id=file_id,
            extension=extension,
        )


def merge_mentions(tx, file_id: str, tags: Iterable[str]) -> None:
    tag_list = list(tags)
    if not tag_list:
        return

    tx.run(
        """
        MATCH (f:File {id: $file_id})
        UNWIND $tags AS tag
        MERGE (t:Tag:Entity {name: tag})
        MERGE (f)-[:MENTIONS]->(t)
        """,
        file_id=file_id,
        tags=tag_list,
    )


def merge_item_chain(tx, parent_chain: list[dict[str, Any]] | None) -> None:
    """Create Collection/File_Container item chain from ordered parent_chain.

    Why: Some flows only enqueue fileId+itemId while others provide full chain;
    this keeps both paths idempotent and preserves hierarchy when available.
    """
    if not parent_chain:
        return

    for node in parent_chain:
        node_id = node.get("id")
        if not node_id:
            continue

        tx.run(
            """
            MERGE (i:Item {id: $id})
            ON CREATE SET i.createdTime = datetime()
            SET i.name = coalesce($name, i.name)
            """,
            id=node_id,
            name=node.get("name"),
        )

        if node.get("itemType") == "COLLECTION":
            tx.run(
                """
                MATCH (i:Item {id: $id})
                SET i:Collection
                """,
                id=node_id,
            )
        elif node.get("itemType") == "FILE_CONTAINER":
            tx.run(
                """
                MATCH (i:Item {id: $id})
                SET i:FileContainer
                """,
                id=node_id,
            )

    for index in range(len(parent_chain) - 1):
        parent_id = parent_chain[index].get("id")
        child_id = parent_chain[index + 1].get("id")
        if not parent_id or not child_id:
            continue

        tx.run(
            """
            MATCH (parent:Item {id: $parent_id})
            MATCH (child:Item {id: $child_id})
            MERGE (parent)-[:CONTAINS]->(child)
            """,
            parent_id=parent_id,
            child_id=child_id,
        )


def merge_file_item_containment(tx, file_id: str, item_id: str | None) -> None:
    """Link Item container to File and enforce FileContainer sub-label.

    Why: Single-file uploads may only have itemId and still need the
    Item:FileContainer -> File structure for downstream graph queries.
    """
    if not item_id:
        return

    tx.run(
        """
        MERGE (f:File {id: $file_id})
        MERGE (i:Item {id: $item_id})
        SET i:FileContainer
        MERGE (i)-[:CONTAINS]->(f)
        """,
        file_id=file_id,
        item_id=item_id,
    )


def merge_duplicate_relation(tx, file_id: str, checksum: str | None) -> None:
    if not checksum:
        return

    tx.run(
        """
        MATCH (f:File {id: $file_id})
        MATCH (other:File)
        WHERE other.checksum = $checksum AND other.id <> f.id
        WITH f, other
        ORDER BY other.id ASC
        LIMIT 1
        WITH
            CASE WHEN f.id < other.id THEN f ELSE other END AS canonical,
            CASE WHEN f.id < other.id THEN other ELSE f END AS dup
        MERGE (dup)-[:DUPLICATE_OF]->(canonical)
        """,
        file_id=file_id,
        checksum=checksum,
    )


def merge_lineage_relation(tx, task: dict) -> None:
    file_id = task["fileId"]
    source_file_id = task.get("sourceFileId")
    if not source_file_id:
        return

    relation = (task.get("lineageRelation") or "DERIVED_FROM").upper()
    rank = task.get("rank")
    original_source_id = task.get("originalSourceId")

    if relation == "DERIVED_FROM":
        tx.run(
            """
            MATCH (f:File {id: $file_id})
            MERGE (src:File {id: $source_file_id})
            WITH f, src
            OPTIONAL MATCH p = (src)-[:DERIVED_FROM*0..32]->(origin:File)
            WHERE NOT (origin)-[:DERIVED_FROM]->(:File)
            WITH f, src, collect(origin) AS origins
            WITH f, src,
                CASE
                    WHEN $original_source_id IS NOT NULL THEN $original_source_id
                    WHEN size(origins) > 0 THEN reduce(min_id = origins[0].id, o IN origins | CASE WHEN o.id < min_id THEN o.id ELSE min_id END)
                    ELSE src.id
                END AS canonical_source_id
            MERGE (canonical:File {id: canonical_source_id})
            MERGE (f)-[:DERIVED_FROM]->(canonical)
            WITH f, canonical
            OPTIONAL MATCH (f)-[r:DERIVED_FROM]->(stale:File)
            WHERE stale.id <> canonical.id
            DELETE r
            """,
            file_id=file_id,
            source_file_id=source_file_id,
            original_source_id=original_source_id,
        )
        return

    if relation == "VERSION_OF":
        tx.run(
            """
            MATCH (f:File {id: $file_id})
            MERGE (src:File {id: $source_file_id})
            MERGE (f)-[r:VERSION_OF]->(src)
            SET r.rank = coalesce($rank, r.rank)
            """,
            file_id=file_id,
            source_file_id=source_file_id,
            rank=rank,
        )
        return

    if relation == "EXTRACTED_FROM":
        tx.run(
            """
            MATCH (f:File {id: $file_id})
            MERGE (src:File {id: $source_file_id})
            MERGE (f)-[:EXTRACTED_FROM]->(src)
            """,
            file_id=file_id,
            source_file_id=source_file_id,
        )
        return

    LOGGER.warning("Unsupported lineage relation: %s", relation)


def fold_derivation_path(tx, final_id: str, source_id: str) -> None:
    tx.run(
        """
        MATCH (final:File {id: $final_id})
        MATCH (source:File {id: $source_id})
        OPTIONAL MATCH p = shortestPath((final)-[:DERIVED_FROM*1..32]->(source))
        MERGE (final)-[:DERIVED_FROM]->(source)
        WITH final, source, CASE WHEN p IS NULL THEN [] ELSE nodes(p) END AS ns
        UNWIND ns AS n
        WITH final, source, n
        WHERE n.id <> final.id AND n.id <> source.id
        SET n.storageStatus = 'logical_only'
        SET n:Ghost
        """,
        final_id=final_id,
        source_id=source_id,
    )


def process_task(driver, task: dict) -> None:
    file_id = task.get("fileId")
    if not file_id:
        raise ValueError("Task does not contain fileId")

    task_version = int(task.get("taskVersion") or TASK_VERSION)
    if task_version != TASK_VERSION:
        raise ValueError(f"Unsupported taskVersion={task_version}")

    task_type = task.get("taskType") or TASK_TYPE_UPSERT

    tags = extract_tags(task.get("physicalPath")
                        ) if ENABLE_FILE_TAG_MENTIONS else []

    with driver.session() as session:
        session.execute_write(merge_file_and_extension, task)
        session.execute_write(merge_item_chain, task.get("parentChain"))
        session.execute_write(merge_file_item_containment,
                              file_id, task.get("itemId"))
        if ENABLE_FILE_TAG_MENTIONS:
            session.execute_write(merge_mentions, file_id, tags)
        session.execute_write(merge_duplicate_relation,
                              file_id, task.get("checksum"))
        session.execute_write(merge_lineage_relation, task)

        if task_type == TASK_TYPE_FOLD:
            source_id = task.get(
                "originalSourceId") or task.get("sourceFileId")
            if source_id:
                session.execute_write(fold_derivation_path, file_id, source_id)

    LOGGER.info(
        "Task processed: taskType=%s fileId=%s extension=%s tags=%s",
        task_type,
        file_id,
        normalize_extension(task),
        len(tags),
    )


def main() -> int:
    setup_logging()

    if not NEO4J_URI or not NEO4J_USERNAME or not NEO4J_PASSWORD:
        LOGGER.error(
            "Missing Neo4j connection envs: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD")
        return 1

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        decode_responses=True,
    )

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
    )

    try:
        initialize_graph_schema(driver)
        LOGGER.info(
            "Worker started. Waiting queue=%s mentions_enabled=%s",
            GRAPH_TASK_QUEUE,
            ENABLE_FILE_TAG_MENTIONS,
        )
        while not STOP:
            result = redis_client.blpop(GRAPH_TASK_QUEUE, timeout=5)
            if not result:
                continue

            _, payload = result
            try:
                task = json.loads(payload)
                process_task(driver, task)
            except Exception as exc:
                LOGGER.exception("Task failed: %s", exc)
                # Sleep briefly to avoid hot error loops for poison messages.
                time.sleep(1)
    finally:
        driver.close()

    LOGGER.info("Worker stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

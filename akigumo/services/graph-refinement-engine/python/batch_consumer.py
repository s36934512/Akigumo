#!/usr/bin/env python3
"""Micro-batching consumer for file graph refinement.

Why: Process 100+ tasks in single Neo4j transaction to reduce network round-trips.
Why: Use UNWIND-based Cypher for atomic bulk operations.
Why: Implement 200ms or 100-task batching to balance latency and throughput.
"""

import json
import logging
import os
import sys
import time
from pathlib import Path

import redis
from neo4j import GraphDatabase

from cypher_mutations import GraphMutations

LOGGER = logging.getLogger("batch_consumer")

GRAPH_TASK_QUEUE = os.getenv("FILE_GRAPH_TASK_QUEUE", "graph_tasks")
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

# Micro-batching tuning
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "100"))  # 100 tasks per batch
BATCH_TIMEOUT_MS = int(os.getenv("BATCH_TIMEOUT_MS", "200"))  # 200ms max wait
ENABLE_FILE_TAG_MENTIONS = os.getenv(
    "ENABLE_FILE_TAG_MENTIONS", "false").lower() == "true"
MAX_TEXT_BYTES = 128 * 1024
MAX_TAGS = 30
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


def consume_batch(
    redis_client: redis.Redis,
    batch_size: int,
    timeout_ms: int,
) -> list[dict]:
    """Consume up to batch_size tasks or wait timeout_ms, whichever comes first.

    Why: Balances throughput (100 tasks) with latency (200ms).
    """
    batch = []
    deadline = time.time() + (timeout_ms / 1000.0)

    while len(batch) < batch_size:
        remaining_wait = deadline - time.time()
        if remaining_wait <= 0:
            break

        # BLPOP with remaining timeout
        timeout_sec = max(0.1, remaining_wait)
        result = redis_client.blpop(GRAPH_TASK_QUEUE, timeout=timeout_sec)

        if not result:
            break

        _, payload = result
        try:
            task = json.loads(payload)
            batch.append(task)
        except json.JSONDecodeError as e:
            LOGGER.error("Failed to parse task JSON: %s", e)
            continue

    return batch


def extract_tags_from_path(physical_path: str | None) -> list[str]:
    """Extract keywords from file at physical_path (up to MAX_TAGS)."""
    import re

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


def normalize_extension(task: dict) -> str:
    extension = (task.get("extension") or "").strip().lower().lstrip(".")
    if extension:
        return extension

    original_name = task.get("originalName") or ""
    suffix = Path(original_name).suffix.lower().lstrip(".")
    return suffix


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


def initialize_graph_schema(driver) -> None:
    """Initialize and validate Neo4j schema."""
    with driver.session() as session:
        session.execute_write(GraphMutations.ensure_constraints_and_indexes)

    LOGGER.info(
        "Neo4j schema ensured: File|Item|Entity constraints and indexes"
    )


def batch_upsert_files_and_extensions(tx, tasks: list[dict]) -> None:
    """Batch merge File nodes and TYPE->Extension relationships.

    Why: UNWIND allows single round-trip for 100+ files.
    Why: MERGE ensures idempotence for retry safety.
    """
    upsert_data = [
        {
            "fileId": task["fileId"],
            "originalName": task.get("originalName"),
            "checksum": task.get("checksum"),
            "storageStatus": resolve_storage_status(task),
            "extension": normalize_extension(task),
        }
        for task in tasks
    ]
    GraphMutations.batch_upsert_files_and_extensions(tx, upsert_data)


def batch_upsert_item_chains(tx, tasks: list[dict]) -> None:
    """Create Item hierarchy from parentChain for each task.

    Why: The Python worker previously only received itemId, which caused the
         Collection > ... > File_Container tree to be absent from Neo4j.
    Why: Process chain nodes first so MATCH in the CONTAINS-pair step always finds them.
    """
    chains = [task["parentChain"] for task in tasks if task.get("parentChain")]
    if not chains:
        return

    collections: list[dict] = []
    containers: list[dict] = []
    pairs: list[dict] = []
    seen_ids: set[str] = set()

    for chain in chains:
        for node in chain:
            if node["id"] not in seen_ids:
                seen_ids.add(node["id"])
                entry = {"id": node["id"], "name": node.get("name")}
                if node.get("itemType") == "COLLECTION":
                    collections.append(entry)
                elif node.get("itemType") == "FILE_CONTAINER":
                    containers.append(entry)

        # Build consecutive CONTAINS pairs along the chain
        for i in range(len(chain) - 1):
            pairs.append({
                "parentId": chain[i]["id"],
                "childId": chain[i + 1]["id"],
            })

    GraphMutations.batch_upsert_item_chain(tx, collections, containers, pairs)


def batch_upsert_file_item_containment(tx, tasks: list[dict]) -> None:
    """Batch merge File-[:CONTAINS]->Item relationships.

    Why: Proper graph structure requires Items as containers.
    Why: UNWIND for atomic bulk relationship creation.
    """
    contains_data = [
        {
            "fileId": task["fileId"],
            "itemId": task.get("itemId"),
        }
        for task in tasks
        if task.get("itemId")
    ]
    GraphMutations.batch_upsert_file_item_containment(tx, contains_data)


def batch_upsert_mentions(tx, tasks: list[dict]) -> None:
    """Batch merge File-[:MENTIONS]->Tag relationships.

    Why: Extract tags from physical files and link atomically.
    """
    if not ENABLE_FILE_TAG_MENTIONS:
        return

    mention_data = []
    for task in tasks:
        physical_path = task.get("physicalPath")
        file_id = task["fileId"]
        tags = extract_tags_from_path(physical_path)

        for tag in tags:
            mention_data.append({
                "fileId": file_id,
                "tag": tag,
            })

    GraphMutations.batch_upsert_mentions(tx, mention_data)


def batch_upsert_duplicate_relations(tx, tasks: list[dict]) -> None:
    """Batch merge duplicate relationships by checksum.

    Why: Checksum-based deduplication across batch.
    """
    dup_data = [
        {
            "fileId": task["fileId"],
            "checksum": task.get("checksum"),
        }
        for task in tasks
        if task.get("checksum")
    ]
    GraphMutations.batch_upsert_duplicate_relations(tx, dup_data)


def batch_upsert_lineage_relations(tx, tasks: list[dict]) -> None:
    """Batch merge lineage relationships (DERIVED_FROM, VERSION_OF, EXTRACTED_FROM).

    Why: Critical for file derivation chain tracking.
    Why: UNWIND handles multiple lineage types atomically.
    """
    lineage_data = [
        {
            "fileId": task["fileId"],
            "sourceFileId": task.get("sourceFileId"),
            "originalSourceId": task.get("originalSourceId"),
            "lineageRelation": (task.get("lineageRelation") or "DERIVED_FROM").upper(),
            "rank": task.get("rank"),
        }
        for task in tasks
        if task.get("sourceFileId")
    ]

    # Partition by relation type for targeted updates
    derived_from_data = [
        row for row in lineage_data
        if row["lineageRelation"] == "DERIVED_FROM"
    ]
    version_of_data = [
        row for row in lineage_data
        if row["lineageRelation"] == "VERSION_OF"
    ]
    extracted_from_data = [
        row for row in lineage_data
        if row["lineageRelation"] == "EXTRACTED_FROM"
    ]

    GraphMutations.batch_upsert_lineage_relations(
        tx,
        derived_from_data,
        version_of_data,
        extracted_from_data,
    )


def batch_fold_derivation_paths(tx, tasks: list[dict]) -> None:
    """Batch fold long derivation paths and mark intermediate nodes as Ghost.

    Why: Simplification and memory optimization for deep file chains.
    """
    fold_data = [
        {
            "finalId": task["fileId"],
            "sourceId": task.get("originalSourceId") or task.get("sourceFileId"),
        }
        for task in tasks
        if task.get("taskType") == "FOLD_DERIVATION_PATH"
        and (task.get("originalSourceId") or task.get("sourceFileId"))
    ]
    GraphMutations.batch_fold_derivation_paths(tx, fold_data)


def process_batch(driver, batch: list[dict]) -> dict:
    """Process a complete batch of tasks in single multi-statement transaction.

    Why: Atomic batch processing reduces inconsistency risk.
    Why: Single transaction for 100+ operations minimizes Neo4j load.
    """
    start_time = time.time()

    with driver.session() as session:
        session.execute_write(batch_upsert_files_and_extensions, batch)
        # Build item hierarchy before linking files so MATCH succeeds.
        session.execute_write(batch_upsert_item_chains, batch)
        session.execute_write(batch_upsert_file_item_containment, batch)
        if ENABLE_FILE_TAG_MENTIONS:
            session.execute_write(batch_upsert_mentions, batch)
        session.execute_write(batch_upsert_duplicate_relations, batch)
        session.execute_write(batch_upsert_lineage_relations, batch)
        session.execute_write(batch_fold_derivation_paths, batch)

    duration_ms = int((time.time() - start_time) * 1000)

    LOGGER.info(
        "Batch processed: count=%d duration=%dms avg=%.2fms/task",
        len(batch),
        duration_ms,
        duration_ms / len(batch) if batch else 0,
    )

    return {
        "processedCount": len(batch),
        "durationMs": duration_ms,
    }


def main() -> int:
    setup_logging()

    if not NEO4J_URI or not NEO4J_USERNAME or not NEO4J_PASSWORD:
        LOGGER.error(
            "Missing Neo4j connection envs: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD"
        )
        return 1

    import signal

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
            "Worker started with micro-batching: batch_size=%d timeout_ms=%d queue=%s mentions_enabled=%s",
            BATCH_SIZE,
            BATCH_TIMEOUT_MS,
            GRAPH_TASK_QUEUE,
            ENABLE_FILE_TAG_MENTIONS,
        )

        while not STOP:
            batch = consume_batch(redis_client, BATCH_SIZE, BATCH_TIMEOUT_MS)

            if not batch:
                continue

            try:
                result = process_batch(driver, batch)
                LOGGER.debug("Batch result: %s", result)
            except Exception as exc:
                LOGGER.exception("Batch processing failed: %s", exc)
                # Sleep briefly to avoid hot error loops
                time.sleep(1)

    finally:
        driver.close()
        redis_client.close()

    LOGGER.info("Worker stopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

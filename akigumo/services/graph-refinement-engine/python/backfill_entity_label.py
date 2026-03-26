#!/usr/bin/env python3
"""Backfill :Entity label for all non-Item/File nodes in Neo4j."""

import logging
import os
import sys

from neo4j import GraphDatabase

LOGGER = logging.getLogger("backfill_entity_label")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")


def setup_logging() -> None:
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )


def apply_backfill(tx) -> int:
    result = tx.run(
        """
        MATCH (n)
        WHERE NOT n:Item AND NOT n:File AND NOT n:Entity
        SET n:Entity
        RETURN count(n) AS updated_count
        """
    )
    record = result.single()
    if not record:
        return 0
    return int(record["updated_count"])


def main() -> int:
    setup_logging()

    if not NEO4J_URI or not NEO4J_USERNAME or not NEO4J_PASSWORD:
        LOGGER.error(
            "Missing Neo4j connection envs: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD"
        )
        return 1

    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
    )

    try:
        with driver.session() as session:
            updated_count = session.execute_write(apply_backfill)
        LOGGER.info("Backfill completed: updated_count=%s", updated_count)
    finally:
        driver.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())

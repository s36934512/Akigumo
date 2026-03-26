#!/usr/bin/env python3
"""Test suite for file graph refinement batch consumer.

Why: Validate micro-batching correctness and performance
Why: Ensure atomic operations and idempotence
Why: Test Item-File-Entity relationship handling
"""

import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Generator

import pytest
import redis

from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable

# Configure test environment
TEST_NEO4J_URI = os.getenv("TEST_NEO4J_URI", "neo4j://neo4j:7687")
TEST_NEO4J_USER = os.getenv("TEST_NEO4J_USER", "neo4j")
TEST_NEO4J_PASS = os.getenv("TEST_NEO4J_PASS", "password")

TEST_REDIS_HOST = os.getenv("TEST_REDIS_HOST", "redis")
TEST_REDIS_PORT = int(os.getenv("TEST_REDIS_PORT", "6379"))
TEST_REDIS_DB = int(os.getenv("TEST_REDIS_DB", "1")
                    )  # Use separate DB for tests

TEST_QUEUE = "test_graph_tasks"


@pytest.fixture
def neo4j_driver():
    """Create Neo4j test driver."""
    driver = GraphDatabase.driver(
        TEST_NEO4J_URI,
        auth=(TEST_NEO4J_USER, TEST_NEO4J_PASS),
        encrypted=False,
    )
    yield driver
    driver.close()


@pytest.fixture
def redis_client():
    """Create Redis test client."""
    client = redis.Redis(
        host=TEST_REDIS_HOST,
        port=TEST_REDIS_PORT,
        db=TEST_REDIS_DB,
        decode_responses=True,
    )
    client.flushdb()  # Clean test DB before test
    yield client
    client.flushdb()  # Clean after test


@pytest.fixture
def sample_tasks():
    """Generate sample tasks for testing."""
    item_id = str(uuid.uuid4())
    tasks = [
        {
            "taskVersion": 1,
            "taskType": "UPSERT_FILE_GRAPH",
            "fileId": str(uuid.uuid4()),
            "itemId": item_id,
            "originalName": f"file_{i}.pdf",
            "extension": "pdf",
            "checksum": f"sha256_{i:04d}",
            "physicalPath": "/tmp/file.pdf",
            "emittedAt": datetime.utcnow().isoformat(),
        }
        for i in range(10)
    ]
    return tasks


class TestBatchConsumer:
    """Tests for micro-batching consumer."""

    def test_can_connect_to_neo4j(self, neo4j_driver):
        """Verify Neo4j connection works."""
        with neo4j_driver.session() as session:
            result = session.run("RETURN 1 as n")
            assert result.single()[0] == 1

    def test_can_connect_to_redis(self, redis_client):
        """Verify Redis connection works."""
        redis_client.set("test_key", "test_value")
        assert redis_client.get("test_key") == "test_value"

    def test_enqueue_tasks(self, redis_client, sample_tasks):
        """Test enqueueing tasks to Redis."""
        for task in sample_tasks:
            redis_client.rpush(TEST_QUEUE, json.dumps(task))

        # Verify all tasks are in queue
        assert redis_client.llen(TEST_QUEUE) == len(sample_tasks)

    def test_dequeue_batch(self, redis_client, sample_tasks):
        """Test consuming batch of tasks from Redis."""
        for task in sample_tasks:
            redis_client.rpush(TEST_QUEUE, json.dumps(task))

        # Dequeue first 5 tasks
        batch = []
        for _ in range(5):
            result = redis_client.blpop(TEST_QUEUE, timeout=1)
            if result:
                _, payload = result
                batch.append(json.loads(payload))

        assert len(batch) == 5
        assert batch[0]["fileId"] == sample_tasks[0]["fileId"]

    def test_file_merge_idempotent(self, neo4j_driver, sample_tasks):
        """Test that File merge is idempotent."""
        from cypher_mutations import GraphMutations

        task = sample_tasks[0]
        upsert_data = [{
            "fileId": task["fileId"],
            "originalName": task["originalName"],
            "checksum": task["checksum"],
            "storageStatus": "on_disk",
            "extension": "pdf",
        }]

        # First write
        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_files_and_extensions,
                upsert_data,
            )

        # Verify File was created
        with neo4j_driver.session() as session:
            result = session.run(
                "MATCH (f:File {id: $id}) RETURN f.name",
                id=task["fileId"],
            )
            assert result.single()[0] == task["originalName"]

        # Second write (should be idempotent)
        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_files_and_extensions,
                upsert_data,
            )

        # Verify File still exists with same value
        with neo4j_driver.session() as session:
            result = session.run(
                "MATCH (f:File {id: $id}) RETURN f.name",
                id=task["fileId"],
            )
            assert result.single()[0] == task["originalName"]

    def test_item_file_containment(self, neo4j_driver, sample_tasks):
        """Test Item-[:CONTAINS]->File relationships."""
        from cypher_mutations import GraphMutations

        task = sample_tasks[0]
        item_id = task["itemId"]

        contains_data = [
            {
                "fileId": task["fileId"],
                "itemId": item_id,
            }
        ]

        # Create relationship
        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_file_item_containment, contains_data)

        # Verify relationship exists
        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (i:Item {id: $itemId})-[:CONTAINS]->(f:File {id: $fileId})
                RETURN count(*) as cnt
                """,
                itemId=item_id,
                fileId=task["fileId"],
            )
            assert result.single()[0] == 1

    def test_item_file_containment_sets_file_container_label(self, neo4j_driver, sample_tasks):
        """Test that batch_upsert_file_item_containment now sets :File_Container label."""
        from cypher_mutations import GraphMutations

        task = sample_tasks[0]
        item_id = task["itemId"]

        contains_data = [{"fileId": task["fileId"], "itemId": item_id}]

        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_file_item_containment, contains_data)

        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (i:Item:FileContainer {id: $itemId})-[:CONTAINS]->(f:File {id: $fileId})
                RETURN count(*) as cnt
                """,
                itemId=item_id,
                fileId=task["fileId"],
            )
            assert result.single()[0] == 1, \
                "Item should have :FileContainer label after containment upsert"

    def test_item_chain_creates_collection_and_container_nodes(self, neo4j_driver):
        """Test that batch_upsert_item_chain creates proper :Collection and :FileContainer nodes."""
        from cypher_mutations import GraphMutations

        col1_id = str(uuid.uuid4())
        col2_id = str(uuid.uuid4())
        container_id = str(uuid.uuid4())

        collections = [
            {"id": col1_id, "name": "folder1"},
            {"id": col2_id, "name": "folder2"},
        ]
        containers = [
            {"id": container_id, "name": "Container for file.pdf"},
        ]
        pairs = [
            {"parentId": col1_id, "childId": col2_id},
            {"parentId": col2_id, "childId": container_id},
        ]

        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_item_chain, collections, containers, pairs)

        # Verify Collection nodes exist with proper label
        with neo4j_driver.session() as session:
            result = session.run(
                "MATCH (i:Item:Collection) WHERE i.id IN $ids RETURN count(*) as cnt",
                ids=[col1_id, col2_id],
            )
            assert result.single()[
                0] == 2, "Both Collection nodes should have :Collection label"

        # Verify FileContainer node exists with proper label
        with neo4j_driver.session() as session:
            result = session.run(
                "MATCH (i:Item:FileContainer {id: $id}) RETURN count(*) as cnt",
                id=container_id,
            )
            assert result.single()[
                0] == 1, "Container should have :FileContainer label"

    def test_item_chain_creates_contains_relationships(self, neo4j_driver):
        """Test that batch_upsert_item_chain creates the full CONTAINS chain in order."""
        from cypher_mutations import GraphMutations

        col_id = str(uuid.uuid4())
        container_id = str(uuid.uuid4())

        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_item_chain,
                [{"id": col_id, "name": "docs"}],
                [{"id": container_id, "name": "Container for report.pdf"}],
                [{"parentId": col_id, "childId": container_id}],
            )

        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (c:Item:Collection {id: $colId})-[:CONTAINS]->(fc:Item:FileContainer {id: $cId})
                RETURN count(*) as cnt
                """,
                colId=col_id,
                cId=container_id,
            )
            assert result.single()[0] == 1, \
                "Collection should CONTAINS FileContainer"

    def test_item_chain_idempotent(self, neo4j_driver):
        """Test that batch_upsert_item_chain is idempotent (MERGE-safe)."""
        from cypher_mutations import GraphMutations

        col_id = str(uuid.uuid4())
        container_id = str(uuid.uuid4())
        collections = [{"id": col_id, "name": "docs"}]
        containers = [{"id": container_id, "name": "Container"}]
        pairs = [{"parentId": col_id, "childId": container_id}]

        for _ in range(3):
            with neo4j_driver.session() as session:
                session.execute_write(
                    GraphMutations.batch_upsert_item_chain, collections, containers, pairs)

        with neo4j_driver.session() as session:
            result = session.run(
                "MATCH (:Item {id: $colId})-[:CONTAINS]->(:Item {id: $cId}) RETURN count(*) as cnt",
                colId=col_id,
                cId=container_id,
            )
            assert result.single()[
                0] == 1, "Idempotent: exactly one CONTAINS relationship"

    def test_batch_duplicate_detection(self, neo4j_driver, sample_tasks):
        """Test batch duplicate linking by checksum."""
        from cypher_mutations import GraphMutations

        # Create two tasks with same checksum
        checksum = "same_checksum_123"
        task1 = sample_tasks[0]
        task2 = sample_tasks[1]

        # First, upsert files
        upsert_data = [
            {
                "fileId": task1["fileId"],
                "originalName": task1["originalName"],
                "checksum": checksum,
                "storageStatus": "on_disk",
                "extension": "pdf",
            },
            {
                "fileId": task2["fileId"],
                "originalName": task2["originalName"],
                "checksum": checksum,
                "storageStatus": "on_disk",
                "extension": "pdf",
            },
        ]

        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_files_and_extensions,
                upsert_data,
            )

        # Now detect duplicates
        dup_data = [
            {"fileId": task1["fileId"], "checksum": checksum},
            {"fileId": task2["fileId"], "checksum": checksum},
        ]

        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_duplicate_relations,
                dup_data,
            )

        # Verify DUPLICATE_OF relationship
        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (f1:File)-[:DUPLICATE_OF]->(f2:File)
                WHERE f1.checksum = $checksum AND f2.checksum = $checksum
                RETURN count(*) as cnt
                """,
                checksum=checksum,
            )
            assert result.single()[0] == 1

    def test_batch_lineage_derived_from(self, neo4j_driver, sample_tasks):
        """Test batch DERIVED_FROM lineage relationships."""
        from cypher_mutations import GraphMutations

        task1 = sample_tasks[0]
        task2 = sample_tasks[1]

        # Create source file first
        with neo4j_driver.session() as session:
            session.run(
                "MERGE (f:File {id: $id})",
                id=task1["fileId"],
            )

        # Create derived file
        derived_from_data = [
            {
                "fileId": task2["fileId"],
                "sourceFileId": task1["fileId"],
                "originalSourceId": None,
                "lineageRelation": "DERIVED_FROM",
                "rank": None,
            }
        ]

        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_lineage_relations,
                derived_from_data,
                [],  # version_of_data
                [],  # extracted_from_data
            )

        # Verify lineage
        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (f1:File)-[:DERIVED_FROM]->(f2:File)
                WHERE f1.id = $id1 AND f2.id = $id2
                RETURN count(*) as cnt
                """,
                id1=task2["fileId"],
                id2=task1["fileId"],
            )
            assert result.single()[0] == 1

    def test_batch_performance(self, neo4j_driver, sample_tasks):
        """Benchmark batch operations performance."""
        import time
        from cypher_mutations import GraphMutations

        # Prepare 100 tasks
        tasks = sample_tasks * 10

        upsert_data = [
            {
                "fileId": task["fileId"],
                "originalName": task["originalName"],
                "checksum": task["checksum"],
                "storageStatus": "on_disk",
                "extension": "pdf",
            }
            for task in tasks
        ]

        # Measure time
        start = time.time()
        with neo4j_driver.session() as session:
            session.execute_write(
                GraphMutations.batch_upsert_files_and_extensions,
                upsert_data,
            )
        elapsed_ms = (time.time() - start) * 1000

        # Verify results
        with neo4j_driver.session() as session:
            result = session.run("MATCH (f:File) RETURN count(*) as cnt")
            count = result.single()[0]

        assert count == len(tasks)
        print(
            f"\n✅ Batch of {len(tasks)} took {elapsed_ms:.1f}ms ({elapsed_ms/len(tasks):.2f}ms/task)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

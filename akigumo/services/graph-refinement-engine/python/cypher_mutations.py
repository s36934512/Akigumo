#!/usr/bin/env python3
"""Cypher query builders for file graph refinement.

Why: Centralize all Cypher logic for easier maintenance and testing.
Why: Support both single-task and batch operations.
Why: Ensure atomic operations with MERGE for idempotence.
"""

from typing import Any

from neo4j import Transaction


class GraphMutations:
    """Encapsulate all Neo4j mutation operations."""

    @staticmethod
    def ensure_constraints_and_indexes(tx: Transaction) -> None:
        """Create all required constraints and indexes for File, Item, Entity."""
        # Uniqueness constraints
        tx.run(
            """
            CREATE CONSTRAINT file_id_unique IF NOT EXISTS
            FOR (f:File)
            REQUIRE f.id IS UNIQUE
            """
        )

        tx.run(
            """
            CREATE CONSTRAINT item_id_unique IF NOT EXISTS
            FOR (i:Item)
            REQUIRE i.id IS UNIQUE
            """
        )

        tx.run(
            """
            CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
            FOR (e:Entity)
            REQUIRE e.id IS UNIQUE
            """
        )

        # Performance indexes
        tx.run(
            """
            CREATE INDEX file_checksum_idx IF NOT EXISTS
            FOR (f:File)
            ON (f.checksum)
            """
        )

        tx.run(
            """
            CREATE INDEX item_name_idx IF NOT EXISTS
            FOR (i:Item)
            ON (i.name)
            """
        )

        tx.run(
            """
            CREATE INDEX entity_name_idx IF NOT EXISTS
            FOR (e:Entity)
            ON (e.name)
            """
        )

        # Indexes for relationship lookups
        tx.run(
            """
            CREATE INDEX file_storage_status_idx IF NOT EXISTS
            FOR (f:File)
            ON (f.storageStatus)
            """
        )

    @staticmethod
    def batch_upsert_files_and_extensions(
        tx: Transaction,
        data: list[dict[str, Any]],
    ) -> None:
        """Batch merge File nodes and TYPE->Extension relationships using UNWIND."""
        tx.run(
            """
            UNWIND $data AS row
            MERGE (f:File {id: row.fileId})
            ON CREATE SET f.createdTime = datetime()
            SET f.name = coalesce(row.originalName, f.name),
                f.checksum = coalesce(row.checksum, f.checksum),
                f.storageStatus = coalesce(row.storageStatus, f.storageStatus, 'on_disk'),
                f.updatedTime = datetime()
            WITH f, row
            WHERE row.extension IS NOT NULL AND row.extension <> ''
            MERGE (e:Ext:Entity {name: row.extension})
            MERGE (f)-[:TYPE]->(e)
            """,
            data=data,
        )

        # Mark/unmark Ghost based on storageStatus
        tx.run(
            """
            UNWIND $data AS row
            MATCH (f:File {id: row.fileId})
            WHERE row.storageStatus = 'logical_only'
            SET f:Ghost
            WITH f, row
            WHERE row.storageStatus = 'on_disk'
            REMOVE f:Ghost
            """,
            data=data,
        )

    @staticmethod
    def batch_upsert_file_item_containment(
        tx: Transaction,
        data: list[dict[str, Any]],
    ) -> None:
        """Batch merge File-[:CONTAINS]->Item relationships.

        Why: Essential for Item-File-Entity graph structure.
        Why: UNWIND for atomic bulk relationship creation.
        Why: SET i:FileContainer ensures the sub-label is present even when
             parentChain processing was skipped or retried out of order.
        """
        if not data:
            return

        tx.run(
            """
            UNWIND $data AS row
            MERGE (f:File {id: row.fileId})
            MERGE (i:Item {id: row.itemId})
            SET i:FileContainer
            MERGE (i)-[:CONTAINS]->(f)
            """,
            data=data,
        )

    @staticmethod
    def batch_upsert_item_chain(
        tx: Transaction,
        collections: list[dict[str, Any]],
        containers: list[dict[str, Any]],
        pairs: list[dict[str, Any]],
    ) -> None:
        """Create Item nodes with proper sub-labels and the CONTAINS chain.

        Why: The full Collection > ... > File_Container hierarchy must exist in
             Neo4j — passing only itemId to the worker was insufficient.
        Why: Separate UNWIND statements per label keep Cypher planner efficient.
        Why: MERGE is idempotent so retries are safe.
        """
        if collections:
            tx.run(
                """
                UNWIND $data AS node
                MERGE (i:Item {id: node.id})
                ON CREATE SET i.createdTime = datetime()
                SET i.name = coalesce(node.name, i.name)
                SET i:Collection
                """,
                data=collections,
            )

        if containers:
            tx.run(
                """
                UNWIND $data AS node
                MERGE (i:Item {id: node.id})
                ON CREATE SET i.createdTime = datetime()
                SET i.name = coalesce(node.name, i.name)
                SET i:FileContainer
                """,
                data=containers,
            )

        if pairs:
            tx.run(
                """
                UNWIND $data AS pair
                MATCH (parent:Item {id: pair.parentId})
                MATCH (child:Item {id: pair.childId})
                MERGE (parent)-[:CONTAINS]->(child)
                """,
                data=pairs,
            )

    @staticmethod
    def batch_upsert_mentions(
        tx: Transaction,
        data: list[dict[str, Any]],
    ) -> None:
        """Batch merge File-[:MENTIONS]->Tag relationships."""
        if not data:
            return

        tx.run(
            """
            UNWIND $data AS row
            MATCH (f:File {id: row.fileId})
            MERGE (t:Tag:Entity {name: row.tag})
            MERGE (f)-[:MENTIONS]->(t)
            """,
            data=data,
        )

    @staticmethod
    def batch_upsert_duplicate_relations(
        tx: Transaction,
        data: list[dict[str, Any]],
    ) -> None:
        """Batch merge duplicate relationships by checksum."""
        if not data:
            return

        tx.run(
            """
            UNWIND $data AS row
            MATCH (f:File {id: row.fileId})
            MATCH (other:File {checksum: row.checksum})
            WHERE other.id <> f.id
            WITH f, other
            ORDER BY other.id ASC
            LIMIT 1
            WITH
                CASE WHEN f.id < other.id THEN f ELSE other END AS canonical,
                CASE WHEN f.id < other.id THEN other ELSE f END AS dup
            MERGE (dup)-[:DUPLICATE_OF]->(canonical)
            """,
            data=data,
        )

    @staticmethod
    def batch_upsert_lineage_relations(
        tx: Transaction,
        derived_from_data: list[dict[str, Any]],
        version_of_data: list[dict[str, Any]],
        extracted_from_data: list[dict[str, Any]],
    ) -> None:
        """Batch merge all lineage relationship types atomically."""
        # DERIVED_FROM: find canonical source and deduplicate
        if derived_from_data:
            tx.run(
                """
                UNWIND $data AS row
                MATCH (f:File {id: row.fileId})
                MERGE (src:File {id: row.sourceFileId})
                WITH f, src, row
                OPTIONAL MATCH p = (src)-[:DERIVED_FROM*0..32]->(origin:File)
                WHERE NOT (origin)-[:DERIVED_FROM]->(:File)
                WITH f, src, row, collect(origin) AS origins
                WITH f, src, row,
                    CASE
                        WHEN row.originalSourceId IS NOT NULL THEN row.originalSourceId
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
                data=derived_from_data,
            )

        # VERSION_OF: preserve rank metadata
        if version_of_data:
            tx.run(
                """
                UNWIND $data AS row
                MATCH (f:File {id: row.fileId})
                MERGE (src:File {id: row.sourceFileId})
                MERGE (f)-[r:VERSION_OF]->(src)
                SET r.rank = coalesce(row.rank, r.rank)
                """,
                data=version_of_data,
            )

        # EXTRACTED_FROM: simple containment lineage
        if extracted_from_data:
            tx.run(
                """
                UNWIND $data AS row
                MATCH (f:File {id: row.fileId})
                MERGE (src:File {id: row.sourceFileId})
                MERGE (f)-[:EXTRACTED_FROM]->(src)
                """,
                data=extracted_from_data,
            )

    @staticmethod
    def batch_fold_derivation_paths(
        tx: Transaction,
        data: list[dict[str, Any]],
    ) -> None:
        """Batch fold long derivation paths and mark intermediate nodes as Ghost.

        Why: Simplifies deep file chains and reduces memory usage.
        """
        if not data:
            return

        tx.run(
            """
            UNWIND $data AS row
            MATCH (final:File {id: row.finalId})
            MATCH (source:File {id: row.sourceId})
            OPTIONAL MATCH p = shortestPath((final)-[:DERIVED_FROM*1..32]->(source))
            MERGE (final)-[:DERIVED_FROM]->(source)
            WITH final, source, CASE WHEN p IS NULL THEN [] ELSE nodes(p) END AS ns
            UNWIND ns AS n
            WITH final, source, n
            WHERE n.id <> final.id AND n.id <> source.id
            SET n.storageStatus = 'logical_only'
            SET n:Ghost
            """,
            data=data,
        )

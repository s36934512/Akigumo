export const getChildrenCypher = `
    MATCH (p:Concept { id: $parentId })-[r]->(c:Concept)
    WHERE $showDeleted = true OR NOT c:Delete
    RETURN
        c.id AS id,
        coalesce(r.order, 0) AS position
        id(r) AS relId,
        type(r) AS relType,
        p.id AS sourceId,
        c.id AS targetId
    ORDER BY r.order IS NULL ASC, r.order ASC
    `;

export const getRootCypher = `
    MATCH (c:Concept:Root)
    WHERE $showDeleted = true OR NOT c:Delete
    RETURN c.id AS id, 0 AS position
    ORDER BY c.createdTime DESC
    `;

export const getAllCypher = `
    MATCH (c:Concept)
    WHERE $showDeleted = true OR NOT c:Delete
    OPTIONAL MATCH (c)-[r]->(target:Concept)
    WHERE $showDeleted = true OR NOT target:Delete
    RETURN 
        c.id AS id, 
        0 AS position,
        id(r) AS relId,
        type(r) AS relType,
        c.id AS sourceId,
        target.id AS targetId
    ORDER BY c.createdTime DESC
    `;

export const getAllCypherB = `
    MATCH (c:Concept)
    WHERE $showDeleted = true OR NOT c:Delete

    OPTIONAL MATCH (c)<-[]-(s:Statement)-[:ABOUT_KEY]->(v:Concept)

    RETURN 
        c.id AS id, 
        0 AS position,
        id(s) AS relId,
        s.type AS relType,
        c.id AS sourceId,
        v.id AS targetId
    ORDER BY c.createdTime DESC
    `;

export const getChildrenCypher = `
    MATCH (p:Item { id: $parentId })-[r:CONTAINS]->(i:Item)
    WHERE $showDeleted = true OR NOT i:Delete

    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(c:Concept)
    WHERE $showDeleted = true
        OR (NOT s:Delete AND NOT c:Delete)

    RETURN i.id AS id, 
           collect({conceptId: c.id, type: s.type}) AS concepts, 
           labels(i) AS labels, 
           0 AS position, 
           i.createdTime AS createdTime
    ORDER BY createdTime DESC
    `;

export const getRootItemsCypher = `
    MATCH (i:Item)
    WHERE NOT (()-[:CONTAINS]->(i)) 
        AND ($showDeleted = true OR NOT i:Delete)
        
    OPTIONAL MATCH (i)-[:WITH]->(s)-[:WITH]->(c:Concept)
    WHERE $showDeleted = true
        OR (NOT s:Delete AND NOT c:Delete)

    RETURN i.id AS id, 
           collect({conceptId: c.id, type: s.type}) AS concepts, 
           labels(i) AS labels, 
           0 AS position, 
           i.createdTime AS createdTime
    ORDER BY createdTime DESC
    `;

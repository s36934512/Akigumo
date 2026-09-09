export const getFileInfosCypher = `
    UNWIND $misses AS targetId
    MATCH (root:FileContainer { id: targetId })-[:DISPLAY_AS]->(f:File)
    ORDER BY targetId
    
    RETURN  targetId AS itemId,
            f.id AS fileId
    `;

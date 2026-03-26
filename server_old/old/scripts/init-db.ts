// import 'dotenv/config'; // 確保能讀取到 .env 變數
// import { executeWrite } from '../core/infrastructure/neo4j';

// async function initNeo4j() {
//     console.log('Starting Neo4j infrastructure initialization...');

//     const constraints = [
//         `CREATE CONSTRAINT file_id_unique IF NOT EXISTS FOR (f:File) REQUIRE f.id IS UNIQUE`,
//     ];

//     for (const cypher of constraints) {
//         try {
//             console.log(`執行中: ${cypher.substring(0, 50)}...`);
//             await executeWrite(cypher);
//         } catch (error) {
//             console.error(`執行失敗:`, error);
//         }
//     }

//     console.log('Neo4j constraints initialized successfully.');
// }

// initNeo4j().catch(err => {
//     console.error('Critical error during DB init:', err);
//     process.exit(1);
// });
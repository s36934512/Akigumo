import 'dotenv/config';
import { Neogma } from "neogma";

const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
    throw new Error('Neo4j environment variables are missing.');
}

export const neogma = new Neogma({
    url: NEO4J_URI,
    username: NEO4J_USERNAME,
    password: NEO4J_PASSWORD,
});

/**
 * 專門給 Server 啟動 (main.ts) 時呼叫
 * 確保資料庫真的活著，才開始監聽 Port
 */
export const connectNeo4j = async () => {
    try {
        await neogma.verifyConnectivity();
        console.log('✅ Neo4j connection verified.');
    } catch (error) {
        console.error('❌ Neo4j connection failed:', error);
        process.exit(1); // 連不上資料庫就讓程式停下來，避免後續報錯難抓
    }
};
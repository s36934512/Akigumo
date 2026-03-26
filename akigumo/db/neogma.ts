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


export const verifyConnectivity = async () => {
    try {
        await neogma.verifyConnectivity();
        console.log('✅ Neo4j connection verified.');
    } catch (error) {
        console.error('❌ Neo4j connection failed:', error);
        process.exit(1);
    }
};
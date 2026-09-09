import "dotenv/config";
import neo4j from "neo4j-driver";
import { Neogma } from "neogma";

const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
	throw new Error("Neo4j environment variables are missing.");
}

export const driver = neo4j.driver(
	NEO4J_URI,
	neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
);

export const neogma = new Neogma({
	url: NEO4J_URI,
	username: NEO4J_USERNAME,
	password: NEO4J_PASSWORD,
});

export const verifyConnectivity = async () => {
	try {
		await neogma.verifyConnectivity();
		await driver.verifyConnectivity();
		console.log("✅ Neo4j connection verified.");
	} catch (error) {
		console.error("❌ Neo4j connection failed:", error);
		process.exit(1);
	}
};

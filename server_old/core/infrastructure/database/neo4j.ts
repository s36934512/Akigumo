import 'dotenv/config';
import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver;

/**
 * Initializes and returns a singleton Neo4j Driver instance.
 * Reads connection details from environment variables.
 * @returns {Driver} The Neo4j driver instance.
 */
export function getDriver(): Driver {
    if (!driver) {
        const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
        if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
            throw new Error('Neo4j environment variables are missing.');
        }
        driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    }
    return driver;
}

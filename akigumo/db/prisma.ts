import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { Prisma, PrismaClient } from "#generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
	adapter,
	log:
		process.env.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: ["error"],
});

export const verifyDbConnection = async () => {
	await prisma.$connect();
	console.log("PostgreSQL connected via Prisma");
};
export { Prisma as PrismaTypes, prisma };

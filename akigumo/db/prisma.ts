import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from 'generated/prisma/client';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});


export const verifyDbConnection = async () => {
    await prisma.$connect();
    console.log('🐘 PostgreSQL connected via Prisma');
};
export { prisma, Prisma as PrismaTypes };
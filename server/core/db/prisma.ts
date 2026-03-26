import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from 'generated/prisma/client';
import { SideEffectExtension } from './prisma-extension';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }).$extends(SideEffectExtension);

export type ExtensionPrisma = typeof prisma;
export type AppTransactionClient = Parameters<Parameters<typeof prisma['$transaction']>[0]>[0];

export { prisma, Prisma as PrismaTypes };
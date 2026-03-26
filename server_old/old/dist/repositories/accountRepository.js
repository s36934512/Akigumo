import { prisma } from '../../prisma/lib/prisma.js';
import { AccountCreateInputObjectSchema } from '../../generated/zod/schemas/objects/AccountCreateInput.schema';
import { LoginRecordCreateInputObjectSchema } from '../../generated/zod/schemas/objects/LoginRecordCreateInput.schema';
import { LogoutRecordCreateInputObjectSchema } from '../../generated/zod/schemas/objects/LogoutRecordCreateInput.schema';
/**
 * Create a new account.
 * @param accountData - The account data.
 */
async function createAccount(accountData) {
    const validation = AccountCreateInputObjectSchema.safeParse(accountData);
    if (!validation.success) {
        throw new Error(`Invalid account data: ${validation.error.message}`);
    }
    try {
        return await prisma.account.create({
            data: validation.data,
        });
    }
    catch (err) {
        console.error('Failed to create account:', err);
        throw err;
    }
}
/**
 * Get an account by identifier.
 * @param identifier - The identifier of the account.
 */
async function getAccountByIdentifier(identifier) {
    if (!identifier) {
        throw new Error('Identifier is required');
    }
    try {
        return await prisma.account.findUnique({
            where: { identifier },
        });
    }
    catch (err) {
        console.error(`Failed to get account with identifier ${identifier}:`, err);
        throw err;
    }
}
/**
 * Create a new login record.
 * @param loginRecordData - The login record data.
 */
async function createLoginRecord(loginRecordData) {
    const validation = LoginRecordCreateInputObjectSchema.safeParse(loginRecordData);
    if (!validation.success) {
        throw new Error(`Invalid login record data: ${validation.error.message}`);
    }
    try {
        return await prisma.loginRecord.create({
            data: validation.data,
        });
    }
    catch (err) {
        console.error('Failed to create login record:', err);
        throw err;
    }
}
/**
 * Create a new logout record.
 * @param logoutRecordData - The logout record data.
 */
async function createLogoutRecord(logoutRecordData) {
    const validation = LogoutRecordCreateInputObjectSchema.safeParse(logoutRecordData);
    if (!validation.success) {
        throw new Error(`Invalid logout record data: ${validation.error.message}`);
    }
    try {
        return await prisma.logoutRecord.create({
            data: validation.data,
        });
    }
    catch (err) {
        console.error('Failed to create logout record:', err);
        throw err;
    }
}
export { createAccount, getAccountByIdentifier, createLoginRecord, createLogoutRecord, };

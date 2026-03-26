import { AccountCreateInputObjectSchema } from '../../generated/zod/schemas/objects/AccountCreateInput.schema';
import { LoginRecordCreateInputObjectSchema } from '../../generated/zod/schemas/objects/LoginRecordCreateInput.schema';
import { LogoutRecordCreateInputObjectSchema } from '../../generated/zod/schemas/objects/LogoutRecordCreateInput.schema';
import { z } from 'zod';
/**
 * Create a new account.
 * @param accountData - The account data.
 */
declare function createAccount(accountData: z.infer<typeof AccountCreateInputObjectSchema>): Promise<any>;
/**
 * Get an account by identifier.
 * @param identifier - The identifier of the account.
 */
declare function getAccountByIdentifier(identifier: string): Promise<any>;
/**
 * Create a new login record.
 * @param loginRecordData - The login record data.
 */
declare function createLoginRecord(loginRecordData: z.infer<typeof LoginRecordCreateInputObjectSchema>): Promise<any>;
/**
 * Create a new logout record.
 * @param logoutRecordData - The logout record data.
 */
declare function createLogoutRecord(logoutRecordData: z.infer<typeof LogoutRecordCreateInputObjectSchema>): Promise<any>;
export { createAccount, getAccountByIdentifier, createLoginRecord, createLogoutRecord, };

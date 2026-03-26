/**
 * @file HTTP handler for file category registry
 *
 * Category writes are kept synchronous because they are lightweight reference
 * data operations and do not require cross-system orchestration.
 */

import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { translatePrismaError } from 'akigumo/shared/utils';

import { categoryRegistryRoute } from './route';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();
const translateCategoryPrismaError = translatePrismaError('檔案分類');

/**
 * Create file category handler
 *
 * This endpoint is synchronous (direct DB write) instead of workflow-based
 * because category setup is a small metadata operation with no downstream
 * cross-system synchronization requirements.
 *
 * Error mapping strategy:
 * - P2002 -> 409 Conflict for duplicate category code
 * - Other errors -> 500 to avoid leaking internal details
 */
export const handleCategoryRegistry = app.openapi(categoryRegistryRoute, async (c) => {
    const body = c.req.valid('json');

    try {
        const fileCategory = await prisma.fileCategory.create({
            data: {
                ...body,
            }
        });
        return c.json(fileCategory, 201);
    } catch (error) {
        const translatedError = translateCategoryPrismaError(error);
        if (translatedError) {
            return c.json({ message: translatedError.message }, translatedError.status);
        }

        return c.json({ message: '伺服器內部錯誤' }, 500);
    }
});

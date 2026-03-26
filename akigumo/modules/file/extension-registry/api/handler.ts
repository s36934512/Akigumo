/**
 * @file HTTP handler for file extension registry
 *
 * Extension registration is synchronous because this reference-data write
 * does not need workflow orchestration or eventual consistency handling.
 */

import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { translatePrismaError } from 'akigumo/shared/utils';
import { Prisma } from 'generated/prisma/client';

import { extensionRegistryRoute } from './route';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();
const translateExtensionPrismaError = translatePrismaError('副檔名');

/**
 * Create file extension handler
 *
 * This endpoint supports connecting to a category by either numeric ID or
 * business code. Supporting both forms allows internal tools (ID-based) and
 * external/admin clients (code-based) to share one API contract.
 *
 * Error mapping strategy:
 * - P2002 -> duplicate extension code (409)
 * - P2025 -> referenced category not found (400)
 * - other DB/runtime errors -> generic 500 response
 */
export const handleExtensionRegistry = app.openapi(extensionRegistryRoute, async (c) => {
    const { categoryId, categoryCode, ...body } = c.req.valid('json');

    const categoryConnect = categoryId
        ? { id: categoryId }
        : { code: categoryCode };

    try {
        const fileExtension = await prisma.fileExtension.create({
            data: {
                ...body,
                category: { connect: categoryConnect }
            }
        });
        return c.json(fileExtension, 201);
    } catch (error) {
        const translatedError = translateExtensionPrismaError(error);
        if (translatedError) {
            return c.json({ message: translatedError.message }, translatedError.status);
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: required related record not found (usually missing category)
            if (error.code === 'P2025') {
                return c.json({ message: '指定的分類 (categoryId 或 categoryCode) 不存在' }, 400);
            }
        }

        // Unexpected errors are normalized to 500 to keep internals private.
        return c.json({ message: '伺服器內部錯誤' }, 500);
    }
});

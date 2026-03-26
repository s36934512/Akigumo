import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import { Paths } from 'akigumo/kernel/paths';
import { cacheService } from 'akigumo/services/cache/cache.service';
import type { FileMeta } from 'libs/schemas/file/file.schema';

import { fileServeRoute } from './route';

const FILE_META_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleFileServe = app.openapi(fileServeRoute, async (c) => {
    const { fileId } = c.req.valid('param');

    // Cache DB lookup so repeated requests for the same file skip Prisma entirely.
    let meta: FileMeta;
    try {
        meta = await cacheService.getOrSet<FileMeta>(
            {
                module: 'File',
                key: fileId,
                ttl: FILE_META_CACHE_TTL,
            },
            async () => {
                const file = await prisma.file.findUnique({
                    where: { id: fileId },
                    select: {
                        physicalPath: true,
                        systemName: true,
                        fileExtension: { select: { mimeType: true } },
                    },
                });
                // Throw so cache-manager does NOT cache the miss — retries stay live.
                if (!file) throw new Error(`file_not_found:${fileId}`);
                return {
                    physicalPath: file.physicalPath,
                    systemName: file.systemName,
                    mimeType: file.fileExtension?.mimeType ?? 'application/octet-stream',
                };
            },
        );
    } catch {
        return c.json({ error: 'Not found' }, 404);
    }

    // Prefer explicit physicalPath; fall back to STORAGE_ORIGINALS + systemName.
    const filePath =
        meta.physicalPath ??
        (meta.systemName ? path.join(Paths.STORAGE_ORIGINALS, meta.systemName) : null);

    if (!filePath || !existsSync(filePath)) {
        return c.json({ error: 'File not accessible' }, 404);
    }

    const buffer = await readFile(filePath);
    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': meta.mimeType,
            // Immutable since fileId is a UUID tied to content identity.
            'Cache-Control': 'max-age=86400, immutable',
        },
    }) as any;
});

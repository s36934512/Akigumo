

import { logger } from "akigumo/db/pino";
import { prisma } from "akigumo/db/prisma";
import { cacheService } from 'akigumo/services/cache/cache.service';
import { FILE_CATEGORY_DEFS } from "libs/contract/constants/file.constants";

const FILE_EXTENSION_CACHE_TTL_MS = 60 * 60 * 1000;
const getFileExtensionCacheKey = (code: string) => `file-ext:${code}`;

/**
 * 輔助函數：Existence Guard - 確保 Category 存在
 */
async function getCategoryByCode(code: string) {
    const category = await prisma.fileCategory.findUnique({
        where: { code },
        select: { id: true }
    });

    if (!category) {
        throw new Error(`CRITICAL_DATA_MISSING: FileCategory with code '${code}' not found in database. Please run seed tasks.`);
    }
    return category;
}

export async function syncFileExtensions() {
    try {
        await prisma.$transaction(async (tx) => {
            for (const cat of Object.values(FILE_CATEGORY_DEFS)) {
                const category = await tx.fileCategory.upsert({
                    where: { code: cat.code },
                    update: { name: cat.name, description: cat.description },
                    create: { code: cat.code, name: cat.name, description: cat.description },
                });

                for (const ext of cat.extensions) {
                    await tx.fileExtension.upsert({
                        where: { code: ext.code },
                        update: {
                            name: ext.name,
                            mimeType: ext.mimeType,
                            description: ext.description,
                            categoryId: category.id,
                        },
                        create: {
                            code: ext.code,
                            name: ext.name,
                            mimeType: ext.mimeType,
                            description: ext.description,
                            categoryId: category.id,
                        },
                    });
                }
            }
        });

        logger.info({ label: 'FileExtension' }, `同步完成。已確保所有預設分類與副檔名存在且為最新。`);
    } catch (error) {
        logger.error({ label: 'FileExtension' }, `同步失敗，已回滾所有異動:`, error);
        throw error; // 視情況決定是否要讓應用程式中斷啟動
    }
}

export async function getFileExtensionId(code: string, mimeType?: string): Promise<number> {
    return await cacheService.getOrSet({
        module: 'Auth',
        key: getFileExtensionCacheKey(code),
        ttl: FILE_EXTENSION_CACHE_TTL_MS,
    }, async () => {
        let targetCategoryId: number;

        // 1. 嘗試尋找符合 MIME 的分類
        if (mimeType) {
            const category = await prisma.fileCategory.findFirst({
                where: { extensions: { some: { mimeType } } },
                select: { id: true }
            });

            if (category) {
                targetCategoryId = category.id;
            } else {
                // Fallback 到 OTHER
                const otherCat = await getCategoryByCode(FILE_CATEGORY_DEFS.OTHER.code);
                targetCategoryId = otherCat.id;
            }
        } else {
            // 無 MIME 時直接找 OTHER
            const otherCat = await getCategoryByCode(FILE_CATEGORY_DEFS.OTHER.code);
            targetCategoryId = otherCat.id;
        }

        // 2. 使用 upsert 寫入 Extension
        const ext = await prisma.fileExtension.upsert({
            where: { code },
            update: {},
            create: {
                code,
                name: code,
                mimeType: mimeType || 'application/octet-stream',
                categoryId: targetCategoryId
            },
            select: { id: true }
        });

        return ext.id;
    });
}

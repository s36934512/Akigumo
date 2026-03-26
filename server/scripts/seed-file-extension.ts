import { cacheService } from "@core/db/cache-manager";
import { prisma } from "@core/db/prisma";
import { FILE_CATEGORY_DEFS } from "libs/contract/constants/file.constants";

export async function syncFileExtensions() {
    const ops = [];

    for (const cat of Object.values(FILE_CATEGORY_DEFS)) {
        ops.push(prisma.fileCategory.upsert({
            where: { code: cat.code },
            update: {
                name: cat.name,
                description: cat.description,
                extensions: {
                    upsert: cat.extensions.map((ext) => ({
                        where: { code: ext.code },
                        update: {
                            name: ext.name,
                            mimeType: ext.mimeType,
                            description: ext.description,
                        },
                        create: {
                            code: ext.code,
                            name: ext.name,
                            mimeType: ext.mimeType,
                            description: ext.description,
                        },
                    })),
                },
            },
            create: {
                code: cat.code,
                name: cat.name,
                description: cat.description,
                extensions: {
                    upsert: cat.extensions.map((ext) => ({
                        where: { code: ext.code },
                        update: {
                            name: ext.name,
                            mimeType: ext.mimeType,
                            description: ext.description,
                        },
                        create: {
                            code: ext.code,
                            name: ext.name,
                            mimeType: ext.mimeType,
                            description: ext.description,
                        },
                    })),
                },
            },
        }));
    }

    if (ops.length > 0) {
        await prisma.$transaction(ops);
    }

    console.log(`[FileExtension] 同步完成。執行了 ${ops.length} 筆資料庫異動。`);
}

export async function getFileExtensionId(code: string, mimeType?: string): Promise<number> {
    const cacheKey = `fileExtension:id:${code}`;

    return cacheService.getOrSet(cacheKey, async () => {
        // 1. 先嘗試找現有的
        const existing = await prisma.fileExtension.findUnique({
            where: { code },
            select: { id: true }
        });
        if (existing) return existing.id;

        // 2. 如果不存在，準備建立。先判斷 Category
        let targetCategoryId: number;

        if (mimeType) {
            const category = await prisma.fileCategory.findFirst({
                where: { extensions: { some: { mimeType } } },
                select: { id: true }
            });
            // 如果找到對應 MIME 的分類就用它，否則用 OTHER
            if (category) {
                targetCategoryId = category.id;
            } else {
                const otherCat = await prisma.fileCategory.findUnique({
                    where: { code: FILE_CATEGORY_DEFS.OTHER.code },
                    select: { id: true }
                });
                targetCategoryId = otherCat!.id;
            }
        } else {
            const otherCat = await prisma.fileCategory.findUnique({
                where: { code: FILE_CATEGORY_DEFS.OTHER.code },
                select: { id: true }
            });
            targetCategoryId = otherCat!.id;
        }

        // 3. 使用 upsert 避免併發造成的 Unique constraint 錯誤
        const ext = await prisma.fileExtension.upsert({
            where: { code },
            update: {}, // 如果已存在就不更新
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

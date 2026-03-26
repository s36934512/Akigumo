import { FILE_CATEGORIES_EXT } from './file-categories-ext.config';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';

export const fileCategoryIdMap = new Map<string, number>();
export const fileExtensionIdMap = new Map<string, number>();

interface FileCacheInitDeps {
    prisma: ExtensionPrisma;
}

/**
 * 啟動器：同步資料庫並建立分類/副檔名 ID 快取
 */
export default async function initFileCategoryCache(deps: FileCacheInitDeps) {
    console.log('[File] 正在快速同步 FileCategory 與 FileExtension 定義...');

    const { prisma } = deps;

    // 1. 一次性抓取 DB 現有的所有資料
    const [existingCategories, existingExtensions] = await Promise.all([
        prisma.fileCategory.findMany(),
        prisma.fileExtension.findMany(),
    ]);

    // 2. 轉換成 Map 方便快速比對 (O(1) 查詢)
    const categoryDbMap = new Map(existingCategories.map(c => [c.code, c]));
    const extensionDbMap = new Map(existingExtensions.map(e => [e.code, e]));

    for (const category of FILE_CATEGORIES_EXT) {
        let dbCategory = categoryDbMap.get(category.code);

        if (!dbCategory) {
            // 如果不存在則建立
            dbCategory = await prisma.fileCategory.create({
                data: {
                    code: category.code,
                    name: category.name,
                    description: category.description,
                },
            });
        } else if (dbCategory.name !== category.name || dbCategory.description !== category.description) {
            // 如果已存在，直接取 ID (若有變動可在此處加一個 update)
            await prisma.fileCategory.update({
                where: { id: dbCategory.id },
                data: {
                    name: category.name,
                    description: category.description,
                },
            });
        }

        fileCategoryIdMap.set(category.code, dbCategory.id);

        // 3. 處理副檔名 (同理)
        for (const ext of category.extensions) {
            let dbExt = extensionDbMap.get(ext.code);
            if (!dbExt) {
                dbExt = await prisma.fileExtension.create({
                    data: {
                        code: ext.code,
                        name: ext.name,
                        categoryId: dbCategory.id,
                    },
                });
            } else if (
                dbExt.name !== ext.name ||
                dbExt.description !== ext.description ||
                dbExt.categoryId !== dbCategory.id
            ) {
                await prisma.fileExtension.update({
                    where: { id: dbExt.id },
                    data: {
                        code: ext.code,
                        name: ext.name,
                        description: ext.description,
                        categoryId: dbCategory.id,
                    },
                });
            }
            fileExtensionIdMap.set(ext.code, dbExt.id);
        }
    }

    console.log('[File] 同步完成，FileCategory 與 FileExtension 已快取');
}

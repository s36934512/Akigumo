import { z } from '@hono/zod-openapi'
import { DatabaseCacheCreateInputObjectSchema } from 'generated/zod/schemas';
import { AppTransactionClient, ExtensionPrisma } from './infrastructure/database/prisma'
import { DatabaseCacheFindBatchUnique, DatabaseCacheFindUnique, DatabaseCacheList, DatabaseCacheUpdateBatchVersion } from 'libs/schemas';

interface DatabaseCacheRepositoryDeps {
    prisma: ExtensionPrisma;
}

class DatabaseCacheRepository {
    constructor(private deps: DatabaseCacheRepositoryDeps) { }

    private get prisma(): ExtensionPrisma { return this.deps.prisma; }

    /**
     * 寫入或更新快取 (Set)
     * 適用於：一般快取、Outbox 任務建立
     */
    async set(
        data: z.infer<typeof DatabaseCacheCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        const client = tx ?? this.prisma;

        return await client.databaseCache.upsert({
            where: {
                namespace_key: { namespace: data.namespace, key: data.key },
            },
            update: {
                value: data.value,
                version: data.version
            },
            create: {
                namespace: data.namespace,
                key: data.key,
                value: data.value,
                version: data.version
            },
        });
    }

    async updateBatchVersion(
        data: DatabaseCacheUpdateBatchVersion,
        tx?: AppTransactionClient
    ) {
        const client = tx ?? this.prisma;

        return await client.databaseCache.updateMany({
            where: {
                namespace: data.namespace,
                key: { in: data.keys }
            },
            data: {
                version: data.version
            },
        });
    }

    /**
     * 讀取快取 (Get)
     * 自動嘗試解析 JSON
     */
    async get<T = any>(
        data: DatabaseCacheFindUnique,
        tx?: AppTransactionClient
    ): Promise<T | null> {
        const client = tx ?? this.prisma;
        const record = await client.databaseCache.findUnique({
            where: {
                namespace_key: { namespace: data.namespace, key: data.key },
            },
        });

        if (!record || !record.value) return null;

        try {
            return record.value as T;
        } catch {
            return record.value as unknown as T;
        }
    }

    /**
     * 刪除快取 (Delete)
     * 適用於：同步完成後清理 Outbox 任務
     */
    async delete(
        data: DatabaseCacheFindUnique,
        tx?: AppTransactionClient
    ) {
        const client = tx ?? this.prisma;
        return await client.databaseCache.delete({
            where: {
                namespace_key: { namespace: data.namespace, key: data.key },
            },
        }).catch(() => null); // 忽略找不到記錄的錯誤
    }

    async deleteBatch(
        data: DatabaseCacheFindBatchUnique,
        tx?: AppTransactionClient
    ) {
        const client = tx ?? this.prisma;
        return await client.databaseCache.deleteMany({
            where: {
                OR: data.keys.map(key => ({
                    namespace: data.namespace,
                    key: key
                }))
            }
        });
    }

    /**
     * 獲取特定命名空間下的所有任務 (Scan)
     * 適用於：定期檢查未完成的 Outbox 任務
     */
    async listByNamespace(
        data: DatabaseCacheList,
        tx?: AppTransactionClient
    ) {
        const client = tx ?? this.prisma;
        const { namespace, limit, version } = data;
        return await client.databaseCache.findMany({
            where: { namespace, version },
            take: limit,
        });
    }
}

export default DatabaseCacheRepository;
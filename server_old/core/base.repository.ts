import { AppTransactionClient, ExtensionPrisma } from '@core/infrastructure/database/prisma';

type PrismaClient = ExtensionPrisma;
type TransactionClient = AppTransactionClient;
/**
 * 取得 PrismaClient 中所有資料表(Models)的名稱
 * 這會排除掉以 $ 開頭的內部方法 (如 $connect, $queryRaw)
 */
type ModelNames = {
    [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: any } ? K : never;
}[keyof PrismaClient];

interface PrismaBaseDeps {
    prisma: ExtensionPrisma;
}

class PrismaBase {
    constructor(private deps: PrismaBaseDeps) { }

    private get prisma(): PrismaClient { return this.deps.prisma; }

    /**
     * 組合式執行器
     * @param modelName 資料表名稱 (例如: 'user')
     * @param operation 操作邏輯
     * @param tx 可選的事務物件
     */
    async execute<M extends ModelNames, T>(
        modelName: M,
        operation: (model: PrismaClient[M], client: TransactionClient | PrismaClient) => Promise<T>,
        tx?: TransactionClient
    ): Promise<T> {
        const client = tx ?? this.prisma;
        const model = (client as any)[modelName] as PrismaClient[M];

        try {
            return await operation(model, client);
        } catch (error) {
            console.error(`[Prisma Error] Table: ${String(modelName)} |`, error);
            throw error;
        }
    }
};

export default PrismaBase;
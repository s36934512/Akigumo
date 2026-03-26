import { Prisma } from 'generated/prisma/client';

interface OutboxPayload {
    action: string;
    label?: string[];
}

/**
 * 封裝一個 Helper 函數，避免重複代碼
 * 這裡 ctx 會自動辨識是在 Transaction 內還是普通環境
 */
async function createOutbox(ctx: any, model: string, id: string, payload: OutboxPayload) {
    if (ctx.databaseCache) {
        await ctx.databaseCache.create({
            data: {
                namespace: `outbox:neo4j:${model}`,
                key: id,
                value: payload,
            }
        });
    }
}

export const SideEffectExtension = Prisma.defineExtension((client) => {
    return client.$extends({
        name: 'SideEffectExtension', // 為你的擴展命名
        query: {
            user: {
                // 攔截 create 動作
                async create({ model, operation, args, query }) {
                    // 1. 執行原本的 user 寫入 (如果是包在 tx 內，這會自動加入該 tx)
                    const result = await query(args);

                    if (result.id) {
                        const ctx = Prisma.getExtensionContext(client);
                        await createOutbox(
                            ctx,
                            'user',
                            result.id,
                            {
                                action: 'CREATE_USER_NODE',
                            }
                        );
                    }
                    return result;
                },
            },
            item: {
                // 攔截 create 動作
                async create({ model, operation, args, query }) {
                    // 1. 執行原本的 item 寫入 (如果是包在 tx 內，這會自動加入該 tx)
                    const result = await query(args);

                    if (result.id) {
                        const ctx = Prisma.getExtensionContext(client);
                        await createOutbox(
                            ctx,
                            'item',
                            result.id,
                            {
                                action: 'CREATE_ITEM_NODE'
                            }
                        );
                    }
                    return result;
                },
            },
        },
    });
});
import { AsyncLocalStorage } from 'node:async_hooks';
import { AppTransactionClient } from '../infrastructure/database/prisma';

export interface RequestContext {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    tx?: AppTransactionClient;
    // 可擴充更多欄位
}

export class ContextService {
    private static contextStorage = new AsyncLocalStorage<RequestContext>();

    static getContext(): RequestContext | undefined {
        return ContextService.contextStorage.getStore();
    }

    static async setContext<T>(ctx: RequestContext, cb: () => Promise<T>): Promise<T> {
        return await ContextService.contextStorage.run(ctx, cb);
    }
}

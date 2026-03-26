import { ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { ACTION_REGISTRY, ActionCode } from './audit-actions.config';

export const actionIdMap = new Map<ActionCode, number>();

interface InitAuditServiceDeps {
    prisma: ExtensionPrisma;
}

/**
 * 啟動器：同步資料庫並建立 ID 快取
 */
export default async function initAuditService(deps: InitAuditServiceDeps) {
    const { prisma } = deps;
    console.log('[Audit] 正在同步 Action 定義...');

    const existingActions = await prisma.action.findMany();
    const actionDbMap = new Map(existingActions.map(c => [c.code, c]));

    for (const code of Object.keys(ACTION_REGISTRY) as ActionCode[]) {
        const config = ACTION_REGISTRY[code];
        let dbAction = actionDbMap.get(code);

        if (!dbAction) {
            // 如果不存在則建立
            dbAction = await prisma.action.create({
                data: {
                    code,
                    name: config.name,
                    description: config.description,
                    category: config.category,
                },
            });
        } else if (
            dbAction.name !== config.name ||
            dbAction.description !== config.description ||
            dbAction.category !== config.category
        ) {
            // 如果已存在，直接取 ID (若有變動可在此處加一個 update)
            await prisma.action.update({
                where: { id: dbAction.id },
                data: {
                    name: config.name,
                    description: config.description,
                    category: config.category,
                },
            });
        }

        actionIdMap.set(code, dbAction.id);
    }
    console.log('[Audit] 同步完成，Action 定義已快取');
}
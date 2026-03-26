import { ALL_ACTIONS, ActionCode, AggregateType } from "@core/audit/audit.registry";
import { cacheService } from "@core/db/cache-manager";
import { prisma } from "@core/db/prisma";
import { ActionCategory } from "generated/prisma/enums";

interface SyncableAction {
    code: string;
    name: string;
    category: ActionCategory;
    description?: string;
}

export async function syncActions() {
    const existingActions = await prisma.action.findMany();
    const actionDbMap = new Map(existingActions.map(c => [c.code, c]));

    const ops = [];

    for (const [aggregate, operations] of Object.entries(ALL_ACTIONS)) {
        const operationEntries = Object.entries(operations) as [string, SyncableAction][];

        for (const [operation, config] of operationEntries) {
            const fullCode = `${aggregate}:${operation}`;
            console.log(`Syncing Action: ${fullCode}`);
            const dbAction = actionDbMap.get(fullCode);

            const actionData = {
                code: fullCode,
                name: config.name,
                description: config.description ?? '',
                category: config.category,
            };

            if (!dbAction) {
                ops.push(prisma.action.create({ data: actionData }));
            } else if (
                dbAction.name !== actionData.name ||
                dbAction.description !== actionData.description ||
                dbAction.category !== actionData.category
            ) {
                ops.push(prisma.action.update({
                    where: { id: dbAction.id },
                    data: actionData
                }));
            }
        }
    }

    if (ops.length > 0) {
        await prisma.$transaction(ops);
    }

    console.log(`[Audit] 同步完成。執行了 ${ops.length} 筆資料庫異動。`);
}

export async function getActionId<T extends AggregateType>(aggregate: T, code: ActionCode<T>): Promise<number> {
    const fullCode = `${aggregate}:${code}`;

    return cacheService.getOrSet(`audit:action:id:${fullCode}`, async () => {
        const action = await prisma.action.findUnique({
            where: { code: fullCode },
            select: { id: true }
        });
        if (!action) throw new Error(`Action ${fullCode} Not Found`);
        return action.id;
    });
}
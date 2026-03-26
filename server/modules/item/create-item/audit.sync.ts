import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { prisma } from "@core/db/prisma";
import { ActionStatus } from "generated/prisma/enums";
import { getActionId } from "@server/scripts/seed-actions";
import { AuditLogCreateManyInputObjectSchema } from "generated/zod/schemas";
import { AggregateType, GetPayload, ITEM_ACTIONS } from "./create-item.contract";

const createItemAudit: ProcessFn = async (input) => {
    const actionId = await getActionId(AggregateType, ITEM_ACTIONS.CREATED.code);

    if (!actionId) {
        throw new Error(`[Audit] 找不到對應的 ActionID: ${ITEM_ACTIONS.CREATED.code}`);
    }

    try {
        const auditEntries = input.map(task => {
            const payload = task.payload as GetPayload<"CREATED", "audit">;

            return AuditLogCreateManyInputObjectSchema.parse({
                message: `Item created with ID: ${payload.itemId}`,
                payload: task.payload,
                correlationId: payload.itemId,
                status: ActionStatus.SUCCESS,
                severity: ITEM_ACTIONS.CREATED.severity,
                actionId: actionId,
            });
        });

        await prisma.auditLog.createMany({
            data: auditEntries,
            skipDuplicates: true,
        });

        console.log(`[Audit] 已成功記錄 ${input.length} 筆審計日誌`);
    } catch (error) {
        console.error(`[Audit] 寫入失敗:`, error);
        throw error;
    }
};

outboxRegistry.register(AggregateType, ITEM_ACTIONS.CREATED.code, createItemAudit);

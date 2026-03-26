import { ActionStatus } from "generated/prisma/enums";
import { AuditLogCreateManyInputObjectSchema } from "generated/zod/schemas";
import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { prisma } from "@core/db/prisma";
import { getActionId } from "@server/scripts/seed-actions";
import { AggregateType, GetPayload, USER_ACTIONS } from "./create-user.contract";

const createUserAudit: ProcessFn = async (input) => {
    const actionId = await getActionId(AggregateType, USER_ACTIONS.CREATED.code);

    if (!actionId) {
        throw new Error(`[Audit] 找不到對應的 ActionID: ${USER_ACTIONS.CREATED.code}`);
    }

    try {
        const auditEntries = input.map(task => {
            const payload = task.payload as GetPayload<"CREATED", "audit">;

            return AuditLogCreateManyInputObjectSchema.parse({
                message: `User created with ID: ${payload.userId}`,
                payload: task.payload,
                correlationId: payload.userId,
                status: ActionStatus.SUCCESS,
                severity: USER_ACTIONS.CREATED.severity,
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

outboxRegistry.register(AggregateType, USER_ACTIONS.CREATED.code, createUserAudit);
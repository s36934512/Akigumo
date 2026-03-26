import { AuditLogCreateManyInputObjectSchema } from "generated/zod/schemas";
import { ActionStatus } from "generated/prisma/enums";
import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { prisma } from "@core/db/prisma";
import { getActionId } from "@server/scripts/seed-actions";
import { AggregateType, FILE_ACTIONS, GetPayload } from "./create-file.contract";

const createAuditProcessor = <T extends "INITIALIZED" | "UPLOADED" | "PROCESSED" | "SYNCED">(
    actionCode: T,
    messageGenerator: (fileId: string) => string
): ProcessFn => async (input) => {
    const action = FILE_ACTIONS[actionCode];
    const actionId = await getActionId(AggregateType, action.code);

    if (!actionId) {
        throw new Error(`[Audit] 找不到對應的 ActionID: ${action.code}`);
    }

    try {
        const auditEntries = input.map(task => {
            const payload = task.payload as GetPayload<T, "audit"> & { fileId: string };

            return AuditLogCreateManyInputObjectSchema.parse({
                message: messageGenerator(payload.fileId),
                payload: task.payload,
                correlationId: payload.fileId,
                status: ActionStatus.SUCCESS,
                severity: action.severity,
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

outboxRegistry.register(
    AggregateType,
    FILE_ACTIONS.INITIALIZED.code,
    createAuditProcessor("INITIALIZED", (fileId) => `File initialized with ID: ${fileId}`)
);

outboxRegistry.register(
    AggregateType,
    FILE_ACTIONS.UPLOADED.code,
    createAuditProcessor("UPLOADED", (fileId) => `File uploaded with ID: ${fileId}`)
);

outboxRegistry.register(
    AggregateType,
    FILE_ACTIONS.PROCESSED.code,
    createAuditProcessor("PROCESSED", (fileId) => `File processed with ID: ${fileId}`)
);

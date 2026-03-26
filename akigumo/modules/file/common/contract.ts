import { z } from "@hono/zod-openapi";
import { defineActions, createEventCodes } from "akigumo/shared/contracts";
import { ActionCategory, Severity } from "generated/prisma/enums";

/**
 * File aggregate identifier used by outbox routing.
 */
export const FILE_AGGREGATE = 'FILE' as const;
/**
 * Workflow identifier for process-file-item flow.
 *
 * Version suffix allows safe rollout of future flow revisions.
 */
export const FILE_PROCESS_ITEM_WORKFLOW_NAME = 'FILE_PROCESS_ITEM_FLOW_V1' as const;

export const FILE_ACTIONS = defineActions({
    RECEIVER_NOTIFY: {
        code: 'FILE_RECEIVER_NOTIFY',
        name: '通知檔案接收模組',
        category: ActionCategory.SYSTEM,
        severity: Severity.LOW,
    },
    INTEGRATION_START_NOTIFY: {
        code: 'FILE_INTEGRATION_START_NOTIFY',
        name: '通知檔案整合模組開始',
        category: ActionCategory.SYSTEM,
        severity: Severity.LOW,
    },
    INTEGRATION_NOTIFY: {
        code: 'FILE_INTEGRATION_NOTIFY',
        name: '通知檔案整合模組',
        category: ActionCategory.SYSTEM,
        severity: Severity.LOW,
    }
});

export type FileActionCode = typeof FILE_ACTIONS[keyof typeof FILE_ACTIONS]['code'];

export const FileEventCode = createEventCodes(FILE_ACTIONS);

export type FileEventCode = typeof FileEventCode[keyof typeof FileEventCode];

export const ReceiverNotifyPayloadSchema = z.object({
    status: z.enum(['COMPLETED', 'FAILED']),
    fileId: z.uuid(),
});

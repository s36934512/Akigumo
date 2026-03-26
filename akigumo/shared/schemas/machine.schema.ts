import { z } from '@hono/zod-openapi';

export const TaskStatusSchema = z.enum([
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED'
]).default('PENDING');


export const TaskSchema = z.object({
    aggregateType: z.string(),
    operation: z.string(),
    payload: z.any(),
    correlationId: z.uuid().optional(),
    status: TaskStatusSchema
});


export const ErrorDetailSchema = z.object({
    code: z.string(),                // 例如: 'UPLOAD_TIMEOUT', 'UNSUPPORTED_MIME'
    message: z.preprocess((val) => {
        return JSON.parse(val as string);
    }, z.string()),             // 給開發者看的詳細訊息
    displayMessage: z.string(),      // 給用戶看的友好訊息 (i18n 鍵值)
    timestamp: z.iso.datetime(),
    path: z.string().optional(),     // 發生在哪個階段 (e.g., 'TUS_UPLOAD')
    originalError: z.any().optional() // 原始錯誤（可選，通常在開發環境紀錄）
});

export const successEvent = <T extends string, D extends z.ZodTypeAny>(type: T, dataSchema: D) =>
    z.object({ type: z.literal(type), data: dataSchema });

export const failureEvent = <T extends string>(type: T) =>
    z.object({ type: z.literal(type), error: ErrorDetailSchema });

/**
 * Constructs a standardized error object from any failure event.
 *
 * Centralizing extraction here ensures all workflows record the same
 * fields regardless of how the upstream processor formats its error.
 */
export function buildWorkflowError(event: unknown, path?: string) {
    const e = event as any;
    const message =
        e.error?.displayMessage ||
        e.error?.message ||
        e.data?.error ||
        'Unknown Workflow Error';

    return {
        code: e.error?.code || 'ERROR_CODE',
        message,
        displayMessage: '系統處理失敗，請稍後再試',
        timestamp: new Date().toISOString(),
        path,
    };
}

export interface Task<T> {
    aggregateType: string;
    operation: string;
    payload: T;
    correlationId?: string;
}

export type PendingTask<T> = Task<T> & { status: 'PENDING' };

export function createPendingTask<T>(task: Task<T>): PendingTask<T> {
    const parsed = TaskSchema.parse({
        ...task,
        status: 'PENDING',
    });

    return parsed as PendingTask<T>;
}
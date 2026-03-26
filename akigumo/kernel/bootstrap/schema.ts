import { z } from '@hono/zod-openapi';
import {
    EVENT_CODE_FAILURE,
    EVENT_CODE_SUCCESS
} from 'akigumo/shared/contracts/event-codes.helper';

export const ProcessorErrorCode = z.enum([
    'DATA_MISSING',
    'VALIDATION_FAILED',
    'INTERNAL_CRASH',
    'BUSINESS_RULE_VIOLATION'
]);
export type ProcessorErrorCode = z.infer<typeof ProcessorErrorCode>;

export const PriorityCode = z.enum(['HIGH', 'NORMAL', 'LOW']);
export type PriorityCode = z.infer<typeof PriorityCode>;

export const ExecutionResultSchema = z.object({
    status: z.enum([EVENT_CODE_SUCCESS, EVENT_CODE_FAILURE]),
    traceId: z.string(),
    data: z.any().optional(),
    error: z.string().optional(),

    errorCode: ProcessorErrorCode.optional(),
    isFatal: z.boolean().default(false),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const KernelMetadataSchema = z.object({
    version: z.string(),
    traceId: z.uuid(),
    timestamp: z.coerce.date(),
    originService: z.string().optional(),
});

export type KernelMetadata = z.infer<typeof KernelMetadataSchema>;

export const KernelContextSchema = z.object({
    workflowId: z.string(),
    correlationId: z.string(),
    aggregateId: z.string(),
    aggregateType: z.string(),
    operation: z.string(),
});

export type KernelContext = z.infer<typeof KernelContextSchema>;

export const KernelMessageSchema = z.object({
    metadata: KernelMetadataSchema,
    context: KernelContextSchema,
    rawPayload: z.unknown(),
});

export type KernelMessage = z.infer<typeof KernelMessageSchema>;

export const StatusUpdateSchema = KernelContextSchema.pick({
    aggregateType: true,
    aggregateId: true,
    correlationId: true,
    operation: true,
}).extend({
    createdTime: z.coerce.date(),
    result: z.preprocess((val) => {
        if (typeof val === "string") {
            try {
                return JSON.parse(val);
            } catch {
                return val;
            }
        }
        return val;
    }, ExecutionResultSchema),
});

export type StatusUpdate = z.infer<typeof StatusUpdateSchema>;

export interface ProcessorDefinition<T> {
    actionName: string;
    schema: z.ZodSchema<T>;
    onBefore?: (data: T) => void;
    logic: (data: T, metadata: KernelMetadata, context: KernelContext) => Promise<any>;
}

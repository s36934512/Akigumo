import { z } from "@hono/zod-openapi";
import {
    EVENT_CODE_FAILURE,
    EVENT_CODE_SUCCESS
} from "akigumo/shared/contracts/event-codes.helper";

import { KernelContext, KernelMetadata, ProcessorDefinition } from "../bootstrap/schema";
import { sendStatusUpdate } from "../feedback/feedback";

export class KernelExecutor {
    static async execute(
        spec: ProcessorDefinition<any>,
        raw: any,
        metadata: KernelMetadata,
        context: KernelContext
    ) {
        try {
            const data = spec.schema.parse(raw);

            if (spec.onBefore) spec.onBefore(data);
            const resultData = await spec.logic(data, metadata, context);

            await sendStatusUpdate({
                aggregateType: context.aggregateType,
                aggregateId: context.aggregateId,
                correlationId: context.correlationId,
                operation: context.operation,
                createdTime: new Date(),
                result: {
                    status: EVENT_CODE_SUCCESS,
                    traceId: metadata.traceId,
                    data: resultData,
                    isFatal: false
                }
            });
            return resultData;
        } catch (error: any) {
            const isFatal = error instanceof z.ZodError || error.message.includes('CRITICAL');
            await sendStatusUpdate({
                aggregateType: context.aggregateType,
                aggregateId: context.aggregateId,
                correlationId: context.correlationId,
                operation: context.operation,
                createdTime: new Date(),
                result: {
                    status: EVENT_CODE_FAILURE,
                    traceId: metadata.traceId,
                    error: error.message,
                    isFatal, errorCode: 'INTERNAL_CRASH'
                }
            });
            throw error;
        }
    }
}
import { z } from "@hono/zod-openapi";

export const MachineContextSchema = z.object({
	// Captures the last failure reason so the FAILED terminal state is self-describing
	// without requiring a separate log query.
	error: z.unknown().nullable(),
	// Holds the serialized task for the next processor step. Cleared on SUCCESS or FAILED
	// to prevent accidental duplicate dispatch on rehydration.
	nextTask: z.unknown().nullable(),
});

export type MachineContext = z.infer<typeof MachineContextSchema>;

export const MachineEventSchema = z.object({
	type: z.string(),
	payload: z.unknown().optional(),
});

export type MachineEvent = z.infer<typeof MachineEventSchema>;

export type MachineArgs = {
	context: MachineContext;
	event: MachineEvent;
};

export const DataPoolSchema = z.object({
	input: z.record(z.string(), z.any()),
	output: z.record(z.string(), z.any()),
});
export type DataPool = z.infer<typeof DataPoolSchema>;

export const TaskStatusSchema = z
	.enum(["PENDING", "IN_PROGRESS", "COMPLETED"])
	.default("PENDING");

export const TaskSchema = z.object({
	aggregateType: z.string(),
	operation: z.string(),
	payload: z.any(),
	correlationId: z.uuid().optional(),
	status: TaskStatusSchema,
});

export const ErrorDetailSchema = z.object({
	code: z.string(), // 例如: 'UPLOAD_TIMEOUT', 'UNSUPPORTED_MIME'
	message: z.preprocess((val) => {
		return JSON.parse(val as string);
	}, z.string()), // 給開發者看的詳細訊息
	displayMessage: z.string(), // 給用戶看的友好訊息 (i18n 鍵值)
	timestamp: z.iso.datetime(),
	path: z.string().optional(), // 發生在哪個階段 (e.g., 'TUS_UPLOAD')
	originalError: z.any().optional(), // 原始錯誤（可選，通常在開發環境紀錄）
});

export const successEvent = <T extends string, D extends z.ZodTypeAny>(
	type: T,
	dataSchema: D,
) => z.object({ type: z.literal(type), data: dataSchema });

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
		"Unknown Workflow Error";

	return {
		code: e.error?.code || "ERROR_CODE",
		message,
		displayMessage: "系統處理失敗，請稍後再試",
		timestamp: new Date().toISOString(),
		path,
	};
}

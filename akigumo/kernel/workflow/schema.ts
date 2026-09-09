import { z } from "@hono/zod-openapi";

import { ResultSchema } from "#akigumo/shared/schemas/common.js";

const WORKFLOW_RECEIVE_VERSION = "1.0.0";

/*
 * 發送者資料結構
 */
const ProcessorSenderSchema = z
	.object({
		action: z.string().openapi({
			description: "processor action name",
			example: "USER_CREATE",
		}),
		id: z.coerce.bigint().openapi({
			description: "outbox id",
			example: "3343",
		}),
	})
	.openapi({
		description: "processor發送者的資料結構",
	});

const PythonSenderSchema = z
	.object({
		action: z.literal("PYTHON"),
	})
	.openapi({
		description: "python發送者的資料結構",
	});

const SenderSchema = z
	.union([ProcessorSenderSchema, PythonSenderSchema])
	.openapi({
		description: "發送者的資料結構，可以是PROCESSOR或PYTHON",
	});

/*
 * 工作流程接收資料結構
 */
export const WorkflowReceiveSchema = z.object({
	version: z.string().default(WORKFLOW_RECEIVE_VERSION).openapi({
		description: "協議版本號",
		example: "1.0.0",
	}),
	workflowId: z.uuid().openapi({
		description: "遞送目標workflow的ID",
		example: "019e3695-9a0d-7710-ba0e-5a6c4e7bfd18",
	}),
	sender: SenderSchema,
	status: ResultSchema,
});

export type WorkflowReceive = z.infer<typeof WorkflowReceiveSchema>;

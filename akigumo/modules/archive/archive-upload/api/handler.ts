import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { ARCHIVE_AGGREGATE } from "#akigumo/modules/archive/common/contract.js";
import {
	publishHandler,
	publishWorkflow,
} from "#akigumo/shared/factories/index.js";
import { toPrismaJson } from "#akigumo/shared/utils/index.js";
import type { Prisma } from "#generated/prisma/client.js";
import { ACTION_LIST, WORKFLOW_TYPE } from "../contract.js";
import { tusIntentRoute, tusSealRoute } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveIntent = app.openapi(tusIntentRoute, async (c) => {
	const payload = c.req.valid("json");

	const traceId = await publishWorkflow({
		workflowType: WORKFLOW_TYPE,
		aggregateType: ARCHIVE_AGGREGATE,
		operation: ACTION_LIST.INTENT.code,
		payload: toPrismaJson(payload) as Prisma.InputJsonValue,
	});

	return c.json({ success: true, traceId }, 202);
});

export const handleArchiveSeal = app.openapi(tusSealRoute, async (c) => {
	const payload = c.req.valid("json");

	const traceId = await publishHandler({
		traceId: payload.batchId,
		aggregateType: ARCHIVE_AGGREGATE,
		operation: ACTION_LIST.SEAL.code,
		payload: {
			fileId: payload.fileId,
			fileName: payload.fileName,
			checksum: payload.checksum,
		},
	});

	return c.json({ success: true, traceId }, 202);
});

export default app;

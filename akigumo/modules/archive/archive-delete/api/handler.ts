import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { ARCHIVE_AGGREGATE } from "#akigumo/modules/archive/common/contract.js";
import { publishWorkflow } from "#akigumo/shared/factories/index.js";

import { ACTION_LIST, WORKFLOW_TYPE } from "../contract.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveDelete = app.openapi(route, async (c) => {
	const payload = c.req.valid("json");

	const traceId = await publishWorkflow({
		workflowType: WORKFLOW_TYPE,
		aggregateType: ARCHIVE_AGGREGATE,
		operation: ACTION_LIST.DELETE.code,
		payload,
	});

	return c.json({ success: true, traceId }, 202);
});

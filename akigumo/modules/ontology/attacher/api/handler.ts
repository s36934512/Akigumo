/**
 * @file HTTP handler for concept registry requests.
 *
 * This handler implements the "fast accept" pattern: it writes to the Outbox
 * within a single transaction and immediately returns 201 to the caller.
 * The actual registry work happens asynchronously in a background worker.
 */
import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { v7 as uuidv7 } from "uuid";

import { prisma } from "#akigumo/db/prisma.js";
import { dispatchTasks } from "#akigumo/kernel/index.js";
import { ONTOLOGY_AGGREGATE } from "#akigumo/modules/ontology/common/contract.js";

import { ACTIONS, WORKFLOW_TYPE } from "../contract.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleOntologyAttacher = app.openapi(route, async (c) => {
	// UUIDv7 is time-sortable, making it efficient for database indexing and
	// useful for chronological tracing across logs, outbox, and audit records.
	const traceId = uuidv7();
	const payload = c.req.valid("json");

	// Write Outbox and WorkflowState atomically. If either fails, neither is
	// persisted — preventing orphaned tasks that have no tracking record, or
	// workflow records that have no associated task to execute.
	await prisma.$transaction([
		prisma.workflowState.create({
			data: {
				id: traceId,
				workflowType: WORKFLOW_TYPE,
				status: "INIT",
			},
		}),

		prisma.outbox.create({
			data: {
				workflowId: traceId,
				aggregateType: ONTOLOGY_AGGREGATE,
				operation: ACTIONS.ATTACHER.code,
				payload,
			},
		}),
	]);

	// Signal the in-process worker to check for new tasks immediately,
	// reducing latency without blocking the HTTP response on execution.
	dispatchTasks();

	return c.json({ success: true, traceId }, 201);
});

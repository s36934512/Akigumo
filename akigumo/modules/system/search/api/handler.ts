/**
 * @file HTTP handler for concept registry requests.
 *
 * This handler implements the "fast accept" pattern: it writes to the Outbox
mport { prisma } from "#akigumo/db/prisma.js"; * within a single transaction and immediately returns 201 to the caller.
 * The actual registry work happens asynchronously in a background worker.
 */
import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { meili } from "#akigumo/db/meiliSearch.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleSystemSearch = app.openapi(route, async (c) => {
	// UUIDv7 is time-sortable, making it efficient for database indexing and
	// useful for chronological tracing across logs, outbox, and audit records.

	const keys = await meili.getKeys();
	// 找出類型為 'search' 或是名稱包含 'Default Search API Key' 的金鑰
	const searchKey = keys.results.find((k) => k.actions.includes("search"));
	console.log("前端 Angular 請使用這組金鑰:", searchKey?.key);

	return c.json({ key: searchKey?.key }, 201);
});

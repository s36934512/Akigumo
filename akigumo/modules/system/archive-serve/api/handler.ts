import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import fs from "fs-extra";

import { systemArchiveServeProcessor } from "../core/processor.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleArchiveServe = app.openapi(route, async (c) => {
	const { fileId } = c.req.valid("param");

	const result = await systemArchiveServeProcessor(fileId);

	if (!result?.filePath) {
		return c.json({ error: "File not accessible" }, 404);
	}

	const fileStream = fs.createReadStream(result.filePath);

	return new Response(fileStream, {
		status: 200,
		headers: {
			"Content-Type": result.mimeType,
			// Immutable since fileId is a UUID tied to content identity.
			"Cache-Control": "max-age=86400, immutable",
		},
	});
});

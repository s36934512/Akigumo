import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { ontologyResolverProcessor } from "../core/processors.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleOntologyResolver = app.openapi(route, async (c) => {
	const body = c.req.valid("json");

	const result = await ontologyResolverProcessor(body);

	return c.json(result, 200);
});

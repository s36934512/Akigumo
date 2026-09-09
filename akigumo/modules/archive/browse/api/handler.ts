import type { HttpBindings } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { browser } from "../core/service.js";
import { route } from "./route.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleBrowse = app.openapi(route, async (c) => {
	const body = c.req.valid("json");

	const result = await browser(body);

	return c.json(result, 200);
});

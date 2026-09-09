/**
 * @file OpenAPI route definition for the system search endpoint.
 *
 * This file only declares the HTTP contract (method, path, request/response schemas).
 * It is intentionally free of business logic — the handler in handler.ts consumes
 * this definition to register actual request processing.
 */
import { createRoute } from "@hono/zod-openapi";
import { ResponseSchema } from "./schema.js";

export const route = createRoute({
	method: "get",
	path: "/system/search",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ResponseSchema,
				},
			},
			description: "實體修改請求成功，回傳流程追蹤 ID",
		},
		400: {
			description: "請求格式錯誤",
		},
	},
});

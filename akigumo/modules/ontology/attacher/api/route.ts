/**
 * @file OpenAPI route definition for the concept creation endpoint.
 *
 * This file only declares the HTTP contract (method, path, request/response schemas).
 * It is intentionally free of business logic — the handler in handler.ts consumes
 * this definition to register actual request processing.
 */
import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
	method: "post",
	path: "/ontology/attacher",
	summary: "更新實體屬性",
	description: "為實體（item，concept）新增屬性、修改既有資料。",
	request: {
		body: {
			content: {
				"application/json": {
					schema: RequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
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

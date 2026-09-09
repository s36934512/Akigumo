import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
	method: "post",
	path: "/ontology/delete",
	summary: "刪除實體",
	description: "刪除一個實體，並刪除關聯。",
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
		202: {
			content: {
				"application/json": {
					schema: ResponseSchema,
				},
			},
			description: "實體刪除 請求成功，回傳流程追蹤 ID",
		},
		400: {
			description: "請求格式錯誤",
		},
	},
});

import { createRoute } from "@hono/zod-openapi";

import { RequestSchema, ResponseSchema } from "./schema.js";

export const route = createRoute({
	method: "post",
	path: "/ontology/editor",
	summary: "修改實體的資料",
	description: "",
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
			description: "請求成功，回傳流程追蹤 ID",
		},
		400: {
			description: "請求格式錯誤",
		},
	},
});

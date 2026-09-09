import { createRoute } from "@hono/zod-openapi";

import { BrowseRequestSchema, BrowseResponseSchema } from "../core/schema.js";

export const route = createRoute({
	method: "post",
	path: "/browse",
	summary: "瀏覽資料夾結構",
	description: "回傳輕量 ID 列表，並自動觸發 SSE 補全詳細內容。",
	request: {
		body: {
			content: {
				"application/json": {
					schema: BrowseRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: BrowseResponseSchema,
				},
			},
			description: "結構資料",
		},
	},
});

import { createRoute, z } from "@hono/zod-openapi";

export const sseStreamRoute = createRoute({
	method: "get",
	path: "/stream",
	summary: "全域 SSE 事件總線",
	description: `保持長連線以接收即時的補丁、上傳進度與系統狀態通知 
	
  	1. 前端接收到事件後，請對 \`data\` 欄位進行 \`JSON.parse()\`。
  	2. 完整的 JSON 資料結構與各事件的 Payload 欄位，請參考下方或底部的 [SseMessageEvent 模型](#/components/schemas/SseMessageEvent)。`,
	responses: {
		200: {
			description: "SSE 串流連線成功",
			content: {
				"text/event-stream": {
					schema: z.string(),
					examples: {
						"進度更新 (PROGRESS)": {
							summary: "進度通知範例",
							value: `data: {"type": "PROGRESS", "payload": {"progress": 85, "message": "檔案上傳中..."}}`
						},
						"概念補丁 (CONCEPT_PATCH)": {
							summary: "補丁更新範例",
							value: `data: {"type": "CONCEPT_PATCH", "payload": [{"op": "UPSERT", "entry": {"id": "123", "name": "測試"}}]}`
						}
					}
				},
			},
		},
	},
});

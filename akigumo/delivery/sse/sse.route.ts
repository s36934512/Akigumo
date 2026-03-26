import { createRoute, z } from '@hono/zod-openapi';

export const sseTraceRoute = createRoute({
    method: 'get',
    path: '/trace/{id}', // OpenAPI 規範使用 {id} 而不是 :id
    request: {
        params: z.object({
            id: z.uuid().openapi({
                param: { name: 'id', in: 'path' },
                example: '14acab20-292e-49aa-a75d-ee1301b8e636',
            }),
        }),
    },
    responses: {
        200: {
            description: 'SSE 事件流',
            content: {
                'text/event-stream': {
                    schema: z.string(), // SSE 回傳的是串流字串
                },
            },
        },
    },
});

import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

import { BrowseExplorerRequestSchema, BrowseExplorerResponseSchema } from '../schema';

const app = new OpenAPIHono();

export const browseRoute = createRoute({
    method: 'post',
    path: '/browse',
    summary: '瀏覽資料夾結構',
    description: '回傳輕量 ID 列表，並自動觸發 SSE 補全詳細內容。',
    request: {
        body: { content: { 'application/json': { schema: BrowseExplorerRequestSchema } } },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: BrowseExplorerResponseSchema } },
            description: '結構資料',
        },
    },
});


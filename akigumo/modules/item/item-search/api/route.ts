import { createRoute } from '@hono/zod-openapi';

import { SearchRequestSchema, SearchResponseSchema } from '../schema';

export const searchItemsRoute = createRoute({
    method: 'post',
    path: '/search/items',
    summary: '全文搜尋 Items',
    description: '透過 MeiliSearch 搜尋項目，支援過濾語法與分頁',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: SearchRequestSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: SearchResponseSchema,
                },
            },
            description: '搜尋結果',
        },
    },
});

import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi'
import { queryItemRoute } from '../routes/query-item.route';
import { container } from '@server/ioc';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>()

export const queryItemHandler = app.openapi(queryItemRoute, async (c) => {
    const query = c.req.valid('query')
    const itemService = container.resolve('itemService');
    // 這裡假設 itemService 有一個 query 方法，實際請根據你的 service 實作
    const result = await itemService.query(query)
    return c.json(result, 200)
})

export default queryItemHandler;

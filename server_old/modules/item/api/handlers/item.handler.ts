import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi'
import { createItemRoute } from '../routes/create-item.route';
import { container } from '@server/ioc';

// 這裡使用 OpenAPIHono 實體
const app = new OpenAPIHono<{ Bindings: HttpBindings }>()

// app.openapi(合約, 實作邏輯)
export const itemHandler = app.openapi(createItemRoute, async (c) => {
    const data = c.req.valid('json') // 這裡會有完美的型別提示

    // 1. 呼叫 Service 存進 Postgres & Neo4j
    const itemService = container.resolve('itemService');
    await itemService.create(data)

    // 2. 回傳結果
    return c.json({ id: '...', }, 201)
})

export default itemHandler;

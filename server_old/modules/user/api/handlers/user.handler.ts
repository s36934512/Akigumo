import { OpenAPIHono } from '@hono/zod-openapi';
import { HttpBindings } from '@hono/node-server';

import { createUserRoute } from '../routes/create-user.route';
import { container } from '@server/ioc';


const app = new OpenAPIHono<{ Bindings: HttpBindings }>()
// app.openapi(合約, 實作邏輯)
export const userHandler = app.openapi(createUserRoute, async (c) => {
    // 1. 取得經驗證過的資料 (Zod 會幫你擋掉不合法的輸入)
    const data = c.req.valid('json');

    container.resolve('userService').registerUser(data);

    // 4. 回傳結果
    return c.json({
        // id: result.user.id,
        // name: result.user.name,
        status: 'success'
    }, 201);
});

export default userHandler;
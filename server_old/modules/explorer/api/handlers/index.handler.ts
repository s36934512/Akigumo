import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { indexRoute } from '../routes/index.route';
import { container } from '@server/ioc';
import { encode, decode } from "@msgpack/msgpack";
import { GetIndexRequest } from 'libs/contract/zod/explorer/v1/api.zod';
import ExplorerOrchestrator from '@server/orchestrators/explorer.orchestrator';

type Variables = {
    userId: string;
};

const app = new OpenAPIHono<{ Bindings: HttpBindings; Variables: Variables }>();

app.openAPIRegistry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'sid_short' // 指定瀏覽器要帶的 Cookie 名稱
})

export const indexHandler = app.openapi(indexRoute, async (c) => {
    const arrayBuffer = await c.req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return c.json({ error: 'Empty body' }, 400);
    }

    const uint8Array = new Uint8Array(arrayBuffer);
    let requestData;
    // 檢查第一個位元組是不是 '{' (123)，如果是，當作 JSON 處理
    if (uint8Array[0] === 123) {
        const text = new TextDecoder().decode(uint8Array);
        requestData = JSON.parse(text);
    } else {
        requestData = decode(uint8Array); // 真正的 MessagePack 解碼
    }

    const parseResult = GetIndexRequest.safeParse(requestData);
    if (!parseResult.success) {
        return c.json({ error: 'Invalid data format', details: parseResult.error }, 400);
    }

    const query = parseResult.data;
    console.log('Parsed request data:', query); // Debug: 查看解析後的請求資料

    const explorerOrchestrator: ExplorerOrchestrator = container.resolve('explorerOrchestrator');
    const result = await explorerOrchestrator.handleIndex(query);
    console.log('Response data before encoding:', result); // Debug: 查看回應資料

    const encoded = encode(result);
    return c.body(encoded, 200, {
        'Content-Type': 'application/x-msgpack',
    });
});

export default indexHandler;

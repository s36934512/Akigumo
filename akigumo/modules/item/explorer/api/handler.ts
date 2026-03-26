import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';

import { browseRoute } from './route';
import { browseExplorer } from '../core/explorer.service';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleExplorer = app.openapi(browseRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await browseExplorer(body);
    return c.json(result, 200);
});
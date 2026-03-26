import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { meili, ITEMS_INDEX } from 'akigumo/db/meiliSearch';

import { searchItemsRoute } from './route';
import { ItemSearchDoc } from '../schema';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>();

export const handleItemSearch = app.openapi(searchItemsRoute, async (c) => {
    const { q, filter, limit, offset } = c.req.valid('json');

    const result = await meili.index(ITEMS_INDEX).search<ItemSearchDoc>(q, {
        filter,
        limit,
        offset,
    });

    return c.json({
        hits: result.hits,
        total: result.estimatedTotalHits ?? result.hits.length,
        limit,
        offset,
    }, 200);
});

export default app;

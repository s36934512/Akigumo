import { serve, HttpBindings } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi';
import { tusServer } from 'akigumo/delivery/tus/tus-server';
import { logger } from 'hono/logger';

import { sseHandler } from './delivery/sse/sse.handler';
import * as kernel from './kernel';
import { handleTagProvisioning } from './modules/entity/tag-provisioning';
import { handleCategoryRegistry } from './modules/file/category-registry';
import { handleExtensionRegistry } from './modules/file/extension-registry';
import { handlefileReceiver } from './modules/file/file-receiver';
import { handleFileServe } from './modules/file/file-serve';
import { handleExplorer } from './modules/item/explorer';
import { handleItemProvisioning } from './modules/item/item-provisioning';
import { handleItemSearch } from './modules/item/item-search';
import { handleUserRegistration } from './modules/user/user-registration';
import './modules/file/file-integration'
import './services/graph-refinement-engine'
import './modules/item/item-file-sync'
import './modules/item/item-search'
import { syncFileExtensions } from './shared/utils/seed-file-extension';
import { translatePrismaError } from './shared/utils/translate-prisma-error';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

await kernel.bootstrap();

await syncFileExtensions();

const app = new OpenAPIHono<{ Bindings: HttpBindings }>().basePath('/api/v1');
const translateGenericPrismaError = translatePrismaError('資料');

app.onError((error, c) => {
    const translatedError = translateGenericPrismaError(error);
    if (translatedError) {
        return c.json({ message: translatedError.message }, translatedError.status);
    }

    console.error('[Unhandled API Error]', error);
    return c.json({ message: '伺服器內部錯誤' }, 500);
});

app.use('*', logger());

app.get('/ui', swaggerUI({ url: '/api/v1/doc' }));
app.doc('/doc', {
    // Expose the OpenAPI JSON document
    openapi: '3.1.0',
    info: { title: 'My API', version: '1.0.0' },
})

app.all('/tus/files/:fileId?', async (c) => {
    const method = c.req.method;
    let targetId = c.req.param('fileId');

    if (method === 'POST') {
        // 從 Metadata Header 抓出 ID (Base64 解碼)
        const metadata = c.req.header('upload-metadata') || '';
        const match = metadata.match(/fileId\s+([^,]+)/);
        if (match) targetId = atob(match[1]);
    }

    console.log(`[Tus] ${method} Target ID: ${targetId || 'New'}`);
    return await tusServer.handleWeb(c.req.raw);
});


app.route('/', sseHandler);
app.route('/', handleTagProvisioning);
app.route('/', handlefileReceiver);
app.route('/', handleCategoryRegistry);
app.route('/', handleExtensionRegistry);
app.route('/', handleItemProvisioning);
app.route('/', handleItemSearch);
app.route('/', handleExplorer);
app.route('/', handleFileServe);
app.route('/', handleUserRegistration);

//test
// app.route('/', handleTest);

serve({
    fetch: app.fetch,
    port: 3049,
});

console.log("Akigumo Core Modules Loaded");
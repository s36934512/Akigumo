// import { serve, HttpBindings } from '@hono/node-server';
// import { logger } from 'hono/logger';
// // import { serveStatic } from '@hono/node-server/serve-static'
// import { cors } from 'hono/cors'
// // import { swaggerUI } from '@hono/swagger-ui'
// import { OpenAPIHono } from '@hono/zod-openapi';
// // import { createBullBoard } from '@bull-board/api';
// // import { HonoAdapter } from '@bull-board/hono';
// // import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';


// // import { setupIoC, container } from './server_old/ioc';
// // import userHandler from '@modules/user/api/handlers/user.handler';
// // import tusServer from '@modules/file/api/routes/tus';
// // import itemHandler from '@modules/item/api/handlers/item.handler';
// // import queryItemHandler from '@modules/item/api/handlers/query-item.handler';


// // import { stringify } from 'yaml';
// // import * as fs from 'fs';
// // import { indexHandler } from '@server/modules/explorer/api/handlers/index.handler';

// // import fileManagerHandler from './server_old/modules/file/api/handlers/file-manager.handler';
// // import uploadsHandler from 'server/modules/file/api/handlers/uploads.handler';
// // import { getThumbnailHandler, getPageImageHandler, downloadFileHandler } from './server_old/modules/file/api/handlers/content.handler';
// // import { authMiddleware } from '@server/middlewares/auth.middleware';

// // (BigInt.prototype as any).toJSON = function () {
// //     return this.toString();
// // };

// // console.time('IoC_Setup');
// // await setupIoC();
// // console.timeEnd('IoC_Setup');



// // const serverAdapter = new HonoAdapter(serveStatic);

// // createBullBoard({
// //     queues: [
// //         new BullMQAdapter(container.resolve('neoSyncPulseQueue')),
// //         new BullMQAdapter(container.resolve('neoSyncSummaryQueue')),
// //         new BullMQAdapter(container.resolve('neoSyncQueue')),
// //         new BullMQAdapter(container.resolve('fileProcessQueue')),
// //     ],
// //     serverAdapter: serverAdapter,
// // });
// // serverAdapter.setBasePath('/api/v1/admin/queues');

// const app = new OpenAPIHono<{ Bindings: HttpBindings }>().basePath('/api/v1')


// app.use('*', logger()) // 記錄所有請求
// app.use('*', cors())// CORS

// // app.use('/explorer/*', authMiddleware);
// // app.use('/up/*', authMiddleware);

// app.post('/tus/files', async (c: Context) => {
//     console.log('正在建立新的上傳任務...');

//     return await tusServer.handleWeb(c.req.raw);
// });
// app.all('/tus/files/*', async (c) => {
//     //處理後續的 HEAD, PATCH, OPTIONS, DELETE 請求 (帶 ID 的路徑)
//     console.log('Received POST request to /tus/files');

//     return await tusServer.handleWeb(c.req.raw)
// });

// app.all('/up', async (c, next) => {
//     console.log('Received request to /up with body:', await c.req.json());

//     return createFileIntentHandler(c);
// })

// // app.use('/public/*', async (c, next) => {
// //     // 靜態檔案
// //     // ...existing code...
// //     await next();
// // })
// // app.use('/uploads/extracted/*', async (c, next) => {
// //     // ...existing code...
// //     await next();
// // })
// // app.use('/storage/*', serveStatic({
// //     root: './storage/originals', // 相對於執行目錄
// //     rewriteRequestPath: (path) => path.replace(/^\/api\/v1\/storage/, '') // 如果有 Prefix 要裁掉
// // }))
// // app.route('/', itemHandler)
// // app.route('/', queryItemHandler)
// // app.route('/', userHandler)
// // app.route('/', indexHandler)

// // // File API handlers
// // // app.route('/files', fileManagerHandler)
// // app.route('/up', uploadsHandler)
// // app.route('/content', getThumbnailHandler)
// // app.route('/content', getPageImageHandler)
// // app.route('/content', downloadFileHandler)
// // app.route('/admin/queues', serverAdapter.registerPlugin())
// // app.get('/ui', swaggerUI({ url: '/api/v1/doc' })); // 渲染 Swagger UI 畫面

// // app.doc('/doc', {
// //     // 產生 OpenAPI JSON
// //     openapi: '3.0.0',
// //     info: { title: 'My API', version: '1.0.0' },
// // })

// // const docs = app.getOpenAPIDocument({
// //     openapi: '3.0.0',
// //     info: { title: 'My API', version: '1.0.0' },
// // });


// serve({
//     fetch: app.fetch,
//     port: 3000,
// });


// // fs.writeFileSync('openapi.yaml', stringify(docs));

// // console.log(Date.now(), 'Starting server...');
// // console.log('Server running on port 3000 (with ws)');

// import { createUserOrchestrator } from '@modules/user/create-user';
// import { createItemOrchestrator } from '@modules/item/create-item';
// import '@modules/file/create-file';
// import { createEntityOrchestrator } from '@modules/entity/create-entity';

// import { startOutboxListener } from '@core/worker/outbox.listener';
// import { tusServer } from '@core/upload/tus-server';

// import { syncActions } from '@server/scripts/seed-actions';
// import { syncFileExtensions } from '@server/scripts/seed-file-extension';

// import { Context } from 'hono';
// import { createFileIntentHandler } from '@modules/file/create-file';
// import { workflowQueue } from '@server/core/workflow/workflow.kernel';

// await syncActions();
// await syncFileExtensions();

// startOutboxListener();

// // await createUserOrchestrator({
// //     name: 'John Doe',
// // });
// // await createItemOrchestrator({
// //     name: 'New Item',
// //     targetItemId: "019cb435-7b22-7977-9045-a2b86fd0a3a8"
// // });
// // await createEntityOrchestrator({
// //     name: 'New Entity',
// //     description: 'Description of the new entity',
// // });

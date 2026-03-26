import { OpenAPIHono, z } from '@hono/zod-openapi'
import { getThumbnailRoute, getPageImageRoute, downloadFileRoute } from '../routes/content.route'
import { HttpBindings } from '@hono/node-server'
// import { ContentOrchestrator } from '../../orchestrators/content.orchestrator'

const app = new OpenAPIHono<{ Bindings: HttpBindings }>()

export const getThumbnailHandler = app.openapi(getThumbnailRoute, async (c) => {
    // const { id } = c.req.valid('params')
    // const stream = await ContentOrchestrator.getThumbnail(id)
    // if (!stream) return c.json({ error: '找不到縮圖' }, 404)
    // // 這裡假設 stream 是 Node.js readable stream
    // return new Response(stream, {
    //     headers: { 'Content-Type': 'image/jpeg' },
    // })
    return c.json({ error: '找不到縮圖' }, 404)
})

export const getPageImageHandler = app.openapi(getPageImageRoute, async (c) => {
    // const { id, pageNumber } = c.req.valid('params')
    // const stream = await ContentOrchestrator.getPageImage(id, Number(pageNumber))
    // if (!stream) return c.json({ error: '找不到頁面' }, 404)
    // return new Response(stream, {
    //     headers: { 'Content-Type': 'image/jpeg' },
    // })
    return c.json({ error: '找不到頁面' }, 404)
})

// // 下載檔案（資料夾壓縮）
// router.get('/download/:name', (req, res) => {
//     const comicDir = path.join(paths.TMP_EXTRACTED, req.params.name);
//     if (!fs.existsSync(comicDir)) {
//         return res.status(404).json({ error: 'Files not found.' });
//     }
//     res.set({
//         'Content-Type': 'application/zip',
//         'Content-Disposition': `attachment; filename="${req.params.name}.zip"`
//     });
//     const archiver = require('archiver');
//     const archive = archiver('zip', { zlib: { level: 9 } });
//     archive.directory(comicDir, false);
//     archive.on('error', err => res.status(500).send({ error: err.message }));
//     archive.pipe(res);
//     archive.finalize();
// });
export const downloadFileHandler = app.openapi(downloadFileRoute, async (c) => {
    // const { id } = c.req.valid('params')
    // // 權限檢查
    // const allowed = await ContentOrchestrator.checkDownloadPermission(id, c)
    // if (!allowed) return c.json({ error: '權限不足' }, 403)
    // const stream = await ContentOrchestrator.getOriginalFile(id)
    // if (!stream) return c.json({ error: '找不到檔案' }, 404)
    // return new Response(stream, {
    //     headers: { 'Content-Disposition': `attachment; filename=\"${id}\"` },
    // })
    return c.json({ error: '找不到檔案' }, 404)
})

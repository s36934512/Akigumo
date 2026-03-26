// import { FileManagerOrchestrator } from '../../orchestrators/file-manager.orchestrator'
import { FileListRequest, FileListResponse, FileDetailResponse, FileEditRequest, FileEditResponse, FileDeleteResponse } from 'libs/contract/zod/file/v1/file-manager.zod'
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { fileListRoute, fileDetailRoute, fileEditRoute, fileDeleteRoute } from '../routes/file-manager.route'
import { HttpBindings } from '@hono/node-server'

const app = new OpenAPIHono<{ Bindings: HttpBindings }>()

export const fileListHandler = app.openapi(fileListRoute, async (c) => {
    const query = c.req.valid('query') as z.infer<typeof FileListRequest>
    // Orchestrator 可根據 query 進行分頁、搜尋、標籤篩選
    // const result = await FileManagerOrchestrator.getMediaLibrary(query)
    // return c.json({ files: result.files, total: result.total }, 200)
    return c.json({ files: [], total: 0 }, 200)
})

export const fileDetailHandler = app.openapi(fileDetailRoute, async (c) => {
    // const { id } = c.req.valid('params')
    // const detail = await FileManagerOrchestrator.getFileDetail(id)
    // if (!detail) return c.json({ error: '找不到檔案' }, 404)
    return c.json({ error: '找不到檔案' }, 404)
})

export const fileEditHandler = app.openapi(fileEditRoute, async (c) => {
    // const { id } = c.req.valid('params')
    // const body = c.req.valid('body') as z.infer<typeof FileEditRequest>
    // const result = await FileManagerOrchestrator.editFile(id, body)
    // if (!result.success) return c.json({ error: '編輯失敗' }, 400)
    // return c.json(result, 200)
    return c.json({ error: '編輯失敗' }, 400)
})

export const fileDeleteHandler = app.openapi(fileDeleteRoute, async (c) => {
    // const { id } = c.req.valid('params')
    // const result = await FileManagerOrchestrator.deleteFile(id)
    // if (!result.success) return c.json({ error: '刪除失敗' }, 400)
    // return c.json(result, 200)
    return c.json({ error: '刪除失敗' }, 400)
})

export default app;

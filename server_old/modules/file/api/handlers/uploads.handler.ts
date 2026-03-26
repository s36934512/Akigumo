import { HttpBindings } from '@hono/node-server';
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { InitUploadRequest } from 'libs/contract/zod/file/v1/uploads.zod'
import { uploadSealRoute, uploadStartRoute } from '../routes/uploads.route'
import { DiskGuard } from '@server/shared/utils/disk-guard.utils';

const app = new OpenAPIHono<{ Bindings: HttpBindings }>()

app.openAPIRegistry.registerComponent('securitySchemes', 'cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'sid_short' // 指定瀏覽器要帶的 Cookie 名稱
})

export const uploadStartHandler = app.openapi(uploadStartRoute, async (c) => {
    const body = c.req.valid('json') as z.infer<typeof InitUploadRequest>

    // [TODO]: 確認空間夠不夠
    DiskGuard.hasEnoughSpace('/data/uploads', body.size).then((hasSpace) => {
        if (!hasSpace) {
            console.warn(`[DiskGuard] 空間不足，無法開始上傳: required=${body.size} bytes`);
            return c.json({ error: '磁碟空間不足，無法開始上傳' }, 507);
        }
    }).catch((error) => {
        console.error(`[DiskGuard] 檢查空間時發生錯誤:`, error);
        return c.json({ error: '檢查磁碟空間時發生錯誤' }, 500);
    });
    // [TODO]: 紀錄上傳意圖(不管成功與否都要紀錄，失敗的話記錄失敗原因)

    return c.json({ uploadId: 'mock-upload-id', allowed: true }, 200)
})

export const uploadSealHandler = app.openapi(uploadSealRoute, async (c) => {
    // const body = c.req.valid('json') as { batchID: string; totalFiles: number }
    // if (!body.batchID || typeof body.totalFiles !== 'number') {
    //     return c.json({ error: 'batchID 與 totalFiles 必填' }, 400)
    // }
    // // TODO: 可在此寫入資料庫或進行後續處理
    // // 例如：await db.saveBatchInfo(batchID, totalFiles);
    // console.log(`[Batch] 結算通知: batchID=${body.batchID}, totalFiles=${body.totalFiles}`)

    return c.json({ success: true }, 200)
})

export default app;
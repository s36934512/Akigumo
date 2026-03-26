// import { createRoute } from 'hono/zod-openapi'
// import { z } from '@hono/zod-openapi'
// import { FileEvent } from 'libs/contract/zod/file/v1/files-events.zod'

// // SSE 連線池
// const clients: Response[] = []

// export const filesEventsRoute = createRoute({
//     method: 'get',
//     path: '/',
//     responses: {
//         200: z.any(), // SSE stream, 非標準 JSON
//     },
//     handler: async (c) => {
//         c.header('Content-Type', 'text/event-stream')
//         c.header('Cache-Control', 'no-cache')
//         c.header('Connection', 'keep-alive')

//         c.res.write(`data: ${JSON.stringify({ type: 'init', files: [] })}\n\n`)
//         clients.push(c.res)

//         c.req.raw.addEventListener('close', () => {
//             const idx = clients.indexOf(c.res)
//             if (idx !== -1) clients.splice(idx, 1)
//             c.res.end()
//         })

//         return c.res
//     }
// })

// // 推播方法
// export function broadcastFileChange(files: z.infer<typeof FileEvent>[]) {
//     const msg = `data: ${JSON.stringify({ type: 'data_changed', files })}\n\n`
//     clients.forEach(res => res.write(msg))
// }

// import { Hono } from 'hono'
// import { streamSSE } from 'hono/streaming'

// const app = new Hono()

// app.get('/sse', (c) => {
//     return streamSSE(c, async (stream) => {
//         let id = 0
//         while (true) {
//             const message = `現在時間是 ${new Date().toLocaleTimeString()}`
//             await stream.writeSSE({
//                 data: message,
//                 event: 'time-update',
//                 id: String(id++),
//             })
//             // 每隔 2 秒推送一次
//             await stream.sleep(2000)
//         }
//     })
// })

// export default app

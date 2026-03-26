import crypto from 'crypto';
import fs from 'fs';
import { pipeline } from 'stream/promises';


async function calculateFileHash(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    try {
        await pipeline(
            stream,
            async function* (sourceStream) {
                for await (const chunk of sourceStream) {
                    hash.update(chunk);
                    yield chunk; // 這裡可以選擇把資料繼續傳下去給別的處理器
                }
            })
        return hash.digest('hex');
    } catch (err) {
        console.error('Hash calculation failed:', err);
        throw err; // 讓 BullMQ 知道任務失敗
    }

}
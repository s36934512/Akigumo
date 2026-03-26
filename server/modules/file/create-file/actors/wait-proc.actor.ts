import { fromPromise } from "xstate";
import { filter, firstValueFrom, take, throwError, timeout } from "rxjs";
import { parseOutboxPayload, status$ } from "@core/db/stream-listener";
import { AggregateType, FILE_ACTIONS } from "../create-file.contract";
import { SaveFileInput } from "../create-file.schema";

/**
 * 異步等待檔案處理完成的 Actor
 * 利用 RxJS status$ 串流監聽 Worker 的執行結果
 */
export const waitProcActor = fromPromise(async ({ input }: { input: SaveFileInput }) => {
    if (!input.fileId) throw new Error('File ID is missing');

    return await firstValueFrom(
        status$.pipe(
            // 1. 只攔截檔案類別的事件
            filter(data => data.aggregateType === AggregateType),
            // 2. 使用核心層的工具進行解析與驗證
            parseOutboxPayload(FILE_ACTIONS.PROCESSED.schemas.graph),
            // 3. 匹配當前正在處理的 File ID
            filter(payload => payload.fileId === input.fileId),
            // 4. 拿到第一個結果就收工
            take(1),
            // 5. 五分鐘超時保護
            timeout({
                each: 300000,
                with: () => throwError(() => new Error('Worker processing timeout'))
            })
        )
    );
});
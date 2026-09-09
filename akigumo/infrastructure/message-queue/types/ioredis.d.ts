import 'ioredis';

declare module 'ioredis' {
    interface Redis {
        /**
         * 查詢 Stream 消費者群組中的 Pending 訊息詳細資訊 (傳入 start, end, count 時的形式)
         * 
         * @param stream Stream 名稱
         * @param group 消費者群組名稱
         * @param start 起始的 Stream ID (例如 '-', 或特定的 '1700000000000-0')
         * @param end 結束的 Stream ID (例如 '+', 或特定的 '1700000000000-0')
         * @param count 每次最多獲取的 Pending 訊息數量
         * @returns 回傳一個包含詳細 Pending 資訊的陣列
         */
        xpending(
            stream: string,
            group: string,
            start: string,
            end: string,
            count: number
        ): Promise<Array<[
            id: string,
            consumer: string,
            time: number,
            deliveryCount: number,
        ]>>;

        /**
         * 擴展 xautoclaim 的型別定義
         * @param stream Stream 名稱
         * @param group 消費者群組名稱
         * @param consumer 消費者名稱
         * @param minIdleTime 最小閒置時間 (毫秒)
         * @param start 起始的 Stream ID (通常第一次傳 '0-0')
         * @param args: Array<string | number>
         * @returns 回傳一個 Promise，包含 [nextCursor, messages, deletedIds]
         */
        xautoclaim(
            stream: string,
            group: string,
            consumer: string,
            minIdleTime: number,
            start: string,
            ...args: Array<string | number>
        ): Promise<[
            nextCursor: string,
            messages: Array<[id: string, fields: string[]]>,
            deletedIds?: string[]
        ]>;

        /**
         * 使用消費者群組（Consumer Group）從一個或多個 Stream 中讀取新訊息或歷史 Pending 訊息
         * 
         * @example
         * // 範例：讀取從未分配給其他消費者的全新訊息 (使用 '>')
         * const result = await redis.xreadgroup('GROUP', 'myGroup', 'consumer1', 'COUNT', 10, 'STREAMS', 'mystream', '>');
         * 
         * @param groupKeyword 必須固定傳入 'GROUP' 字串
         * @param group 消費者群組名稱
         * @param consumer 消費者名稱
         * @param args 包含選填參數（如 'COUNT', 10, 'BLOCK', 2000）與必須參數（'STREAMS', stream1, stream2, ..., id1, id2, ...）的陣列
         * @returns 回傳一個巢狀陣列，若超時（BLOCK）且無資料則回傳 null。
         *          結構為：[[streamName, [[messageId, [field, value, ...]]]]]
         */
        xreadgroup(
            groupKeyword: 'GROUP',
            group: string,
            consumer: string,
            ...args: Array<string | number>
        ): Promise<Array<[
            /** Stream 名稱 */
            streamName: string,
            /** 該 Stream 讀取到的訊息列表 */
            messages: Array<[
                /** 訊息 ID */
                id: string,
                /** 訊息內容 [key1, val1, key2, val2, ...] */
                fields: string[]
            ]>
        ]> | null>;
    }
}

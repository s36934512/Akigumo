/**
 * 處理 JSON 寫入前的特殊類型轉換
 * 處理包含 BigInt、Date 的複雜物件
 */
export const toPrismaJson = (data: any): any => {
    return JSON.parse(
        JSON.stringify(data, (key, value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            return value;
        })
    );
};
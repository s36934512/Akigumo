import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { encode, decode } from '@msgpack/msgpack';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Orval 傳入的 config 結構通常包含 url, method, params, data, headers
 */
export const customInstance = <T>(
    config: {
        url: string;
        method: string;
        params?: any;
        data?: any;
        headers?: any;
        responseType?: string;
    },
    http: HttpClient
): Promise<T> => {

    // 1. Build full URL using environment config (empty in dev → proxy handles it)
    const fullUrl = `${environment.apiUrl}${config.url}`;

    // 2. 處理 Request Body (MessagePack 編碼)
    let body = config.data;
    // let headers = new HttpHeaders(config.headers || {});

    // if (body && !(body instanceof FormData) && !(body instanceof Blob)) {
    //     // 將物件編碼為 MessagePack (Uint8Array)
    //     body = encode(body);
    //     // 必須明確告知後端這是 MessagePack
    //     headers = headers.set('Content-Type', 'application/x-msgpack');
    //     headers = headers.set('Accept', 'application/x-msgpack');
    // }

    // // 3. 執行請求
    // // 我們使用 firstValueFrom 將 Observable 轉為 Promise 以符合 Orval 的預設行為
    // return firstValueFrom(
    //     http.request<any>(config.method, fullUrl, {
    //         body,
    //         headers,
    //         params: new HttpParams({ fromObject: config.params }),
    //         // 關鍵：告訴 HttpClient 我們要拿原始的二進位資料 (ArrayBuffer)
    //         responseType: 'arraybuffer' as 'json'
    //     })
    // ).then((res: ArrayBuffer) => {
    //     // 4. 回應攔截：將二進位資料解碼回 JSON
    //     try {
    //         const uint8Array = new Uint8Array(res);
    //         return decode(uint8Array) as T;
    //     } catch (e) {
    //         // 如果解碼失敗（例如後端回傳的是純文字錯誤訊息），直接回傳原始資料或報錯
    //         console.error('MessagePack decode error:', e);
    //         return res as unknown as T;
    //     }
    // }).catch(err => {
    //     // 5. 統一錯誤處理
    //     console.error('API Error:', err);
    //     throw err;
    // });
    return firstValueFrom(
        http.request<T>(config.method, fullUrl, {
            body,
            headers: new HttpHeaders(config.headers),
            params: new HttpParams({ fromObject: config.params }),
            // 3. 將 responseType 改回 'json' (預設即是 json)
            responseType: 'json'
        })
    ).catch(err => {
        console.error('API Error:', err);
        throw err;
    });
};

// Orval 需要這個型別定義
export type ErrorType<Error> = Error;
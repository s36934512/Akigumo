import { inject, NgZone, Service } from "@angular/core";
import { catchError, filter, map, Observable, shareReplay } from "rxjs";
import { environment } from "../../environments/environment";

@Service()
export class SseConnectionService {
	private zone = inject(NgZone);

	private sharedStream$?: Observable<MessageEvent>;

	/**
	 * 業務層專用的訂閱核心
	 * 第一次被呼叫時會自動啟動全域唯一的長連線，後續呼叫者皆共享同一個實例
	 */
	public watchTopic<T>(eventType: string): Observable<T> {
		if (!this.sharedStream$) {
			this.sharedStream$ = new Observable<MessageEvent>((subscriber) => {
				if (typeof window === "undefined") {
					subscriber.complete();
					return;
				}

				const url = `${environment.apiUrl}/api/v1/stream`;
				console.log(`[Shared SSE] 啟動全域唯一的 SSE 長連線: ${url}`);
				const source = new EventSource(url);

				source.onmessage = (event) =>
					this.zone.run(() => subscriber.next(event));
				source.onerror = () => {
					if (source.readyState === EventSource.CLOSED) {
						this.zone.run(() =>
							subscriber.error(new Error("SSE connection closed")),
						);
					}
				};

				return () => {
					console.warn("[Shared SSE] 長連線已斷開");
					source.close();
				};
			}).pipe(
				// refCount: false 確保畫面上沒有任何元件訂閱時，背景連線依然暢通不中斷
				shareReplay({ bufferSize: 1, refCount: false }),
			);
		}

		// 負責為各個業務層過濾與清洗資料
		return this.sharedStream$.pipe(
			// 1. 先統一解析，失敗就回傳 null
			map((event) => {
				try {
					return JSON.parse(event.data);
				} catch {
					return null;
				}
			}),
			// 2. 過濾掉髒資料與型態不符的資料
			filter((parsed): parsed is { type: string; payload: T } => {
				return parsed !== null && parsed.type === eventType;
			}),
			// 3. 此時資料已保證安全且解析過，直接拿取 payload
			map((parsed) => parsed.payload),
			// 4. 錯誤處理
			catchError((err, caught) => {
				console.error(`[Shared SSE] Topic [${eventType}] 發生異常:`, err);
				return caught;
			}),
		);
	}
}

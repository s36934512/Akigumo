import { isPlatformBrowser } from "@angular/common";
import { DestroyRef, inject, PLATFORM_ID, Service } from "@angular/core";

export type SseHandler = (
	payload: unknown,
	metadata: { notifyId: string; timestamp: number },
) => void;

@Service()
export class SseBrokerService {
	private readonly destroyRef = inject(DestroyRef);
	private readonly platformId = inject(PLATFORM_ID);

	private eventSourcesMap = new Map<string, EventSource>();

	// 記錄每個 URL 註冊了哪些事件處理器 Map<url, Map<eventType, Set<handler>>>
	private handlersMap = new Map<string, Map<string, Set<SseHandler>>>();

	constructor() {
		this.destroyRef.onDestroy(() => this.closeAll());
	}

	/**
	 * 註冊特定事件的處理方式
	 * @param streamUrl SSE 的連線網址
	 * @param eventType 事件類型
	 * @param handler 觸發時要執行的自定義邏輯
	 */
	public registerHandler(
		streamUrl: string,
		eventType: string,
		handler: SseHandler,
	): () => void {
		let urlHandlers = this.handlersMap.get(streamUrl);
		if (!urlHandlers) {
			urlHandlers = new Map();
			this.handlersMap.set(streamUrl, urlHandlers);
		}

		let eventSet = urlHandlers.get(eventType);
		if (!eventSet) {
			eventSet = new Set();
			urlHandlers.set(eventType, eventSet);
		}

		eventSet.add(handler);

		return () => {
			eventSet?.delete(handler);

			if (eventSet?.size === 0) {
				urlHandlers?.delete(eventType);
			}
		};
	}

	/**
	 * 啟動連線（支援 SSR 安全防禦與動態即時分流）
	 */
	public listen(streamUrl: string): void {
		if (!isPlatformBrowser(this.platformId)) {
			console.log("SSR 環境：跳過 EventSource 初始化");
			return;
		}

		if (this.eventSourcesMap.has(streamUrl)) {
			return;
		}

		const eventSource = new EventSource(streamUrl);
		this.eventSourcesMap.set(streamUrl, eventSource);

		eventSource.addEventListener("message", (event: MessageEvent) => {
			try {
				const { notifyId, type, payload, timestamp } = JSON.parse(
					event.data,
				);

				const urlHandlers = this.handlersMap.get(streamUrl);
				const handlers = urlHandlers?.get(type);

				if (handlers && handlers.size > 0) {
					handlers.forEach((handler) => {
						handler(payload, { notifyId, timestamp });
					});
				} else {
					console.warn(`[SSE] 收到未註冊的事件類型: ${type}`);
				}
			} catch (err) {
				console.error(`[SSE] 解析後端廣播訊息失敗:`, err);
			}
		});

		eventSource.onerror = (err) =>
			console.error(`[SSE 錯誤] ${streamUrl}`, err);

		this.destroyRef.onDestroy(() => this.closeAll());
	}

	/**
	 * 關閉特定單一 URL 連線與清理
	 */
	public close(streamUrl: string): void {
		const source = this.eventSourcesMap.get(streamUrl);
		if (source) {
			source.close();
			this.eventSourcesMap.delete(streamUrl);
			this.handlersMap.delete(streamUrl);
			console.log(`[SSE] 已成功關閉單一通道: ${streamUrl}`);
		}
	}

	public closeAll(): void {
		this.eventSourcesMap.forEach((source) => {
			source.close();
		});
		this.eventSourcesMap.clear();
		this.handlersMap.clear();
		console.log("[SSE] 已全域清空關閉所有 SSE 連線與監聽器");
	}
}

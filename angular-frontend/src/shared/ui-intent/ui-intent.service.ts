import { InjectionToken, inject } from "@angular/core";
import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { type UiToken, UiTokenEnum } from "./ui-token.model";

export type ActiveIntent = {
	payload: unknown;
};

export type UiIntentState = {
	activeIntents: Record<UiToken, ActiveIntent | null>;
};

const initialState: UiIntentState = {
	activeIntents: UiTokenEnum.options.reduce(
		(acc, token) => {
			acc[token] = null;
			return acc;
		},
		{} as Record<UiToken, ActiveIntent | null>,
	),
};

export interface InspectStrategy<
	TData = unknown,
	TToken extends UiToken = UiToken,
> {
	onDispatch?: (token: TToken, payload: TData) => void;
	onClear?: (token: TToken) => void;
	onClearAll?: () => void;
}

export const INSPECT_STRATEGY = new InjectionToken<InspectStrategy>(
	"INSPECT_STRATEGY",
);

export const UiIntentStore = signalStore(
	withState(initialState),

	withMethods((store) => {
		// ⚡ 內部自動注入當前區域的策略
		const strategy = inject(INSPECT_STRATEGY, { optional: true });

		return {
			isOpened(token: UiToken): boolean {
				return store.activeIntents()[token] !== null;
			},

			getPayload<T = unknown>(token: UiToken): T | null {
				return (store.activeIntents()[token]?.payload as T) ?? null;
			},

			// 開啟特定的側邊欄/彈窗，互不干涉
			dispatch(token: UiToken, payload?: unknown): void {
				patchState(store, (state) => ({
					activeIntents: {
						...state.activeIntents,
						[token]: { payload: payload ?? null },
					},
				}));

				// 觸發該區域配置的專屬中繼策略邏輯
				strategy?.onDispatch?.(token, payload);
			},

			// 關閉特定的側邊欄/彈窗
			clear(token: UiToken): void {
				patchState(store, (state) => ({
					activeIntents: {
						...state.activeIntents,
						[token]: null,
					},
				}));

				strategy?.onClear?.(token);
			},

			// 全部重設（不開）
			clearAll(): void {
				patchState(store, initialState);

				strategy?.onClearAll?.();
			},
		};
	}),
);

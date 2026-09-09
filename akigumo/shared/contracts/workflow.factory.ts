import type { ActionCategory, Severity } from "#generated/prisma/enums.js";

// 定義一個標準的 Action 結構
export interface BaseAction {
	code: string;
	name: string;
	category: ActionCategory;
	severity: Severity;
}

export function createEventCodes<
	const T extends Record<string, { readonly code: string }>,
>(actions: T) {
	type SuccessResult = {
		[K in keyof T as `${T[K]["code"]}_SUCCESS`]: `${T[K]["code"]}_SUCCESS`;
	};
	type FailureResult = {
		[K in keyof T as `${T[K]["code"]}_FAILURE`]: `${T[K]["code"]}_FAILURE`;
	};
	type ReturnType = SuccessResult & FailureResult;

	const result = {} as Record<string, string>;

	for (const key in actions) {
		const code = actions[key].code;
		const successKey = `${code}_SUCCESS` as const;
		const failureKey = `${code}_FAILURE` as const;

		result[successKey] = successKey;
		result[failureKey] = failureKey;
	}

	return result as ReturnType;
}

// 萬用型別提取器：直接傳入 ACTIONS 的型別，自動吐出 ActionCode 和 EventCode 型別
export type InferActionCode<T extends Record<string, BaseAction>> =
	T[keyof T]["code"];
export type InferEventCode<T extends Record<string, BaseAction>> = ReturnType<
	typeof createEventCodes<T>
>[keyof ReturnType<typeof createEventCodes<T>>];

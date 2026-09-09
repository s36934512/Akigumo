/**
 * 用於標記不需要重試的致命錯誤
 */
export class NonRetryableError extends Error {
	readonly retryable = false;
	constructor(message: string) {
		super(message);
		this.name = "NonRetryableError";
	}
}

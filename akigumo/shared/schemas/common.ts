import z from "zod";

export const SUCCESS = "SUCCESS";
export const FAILURE = "FAILURE";

const StatusSchema = z.enum([SUCCESS, FAILURE]);
export type Status = z.infer<typeof StatusSchema>;

export function isSuccess(s: Status) {
	return s === SUCCESS;
}

export function isFailure(s: Status) {
	return s === FAILURE;
}

export const SuccessResultSchema = z
	.object({
		status: z.literal(SUCCESS),
		data: z.unknown().optional().openapi({
			description: "成功狀態的資料",
			example: "id",
		}),
	})
	.openapi({
		description: "成功狀態的結構",
	});

export const FailureResultSchema = z
	.object({
		status: z.literal(FAILURE),
		error: z.unknown().openapi({
			description: "失敗狀態的錯誤訊息",
			example: "Invalid input data",
		}),
	})
	.openapi({
		description: "失敗狀態的結構",
	});

export const ResultSchema = z
	.union([SuccessResultSchema, FailureResultSchema])
	.openapi({
		description: "狀態更新的結果結構，包含狀態碼、資料和錯誤訊息",
	});

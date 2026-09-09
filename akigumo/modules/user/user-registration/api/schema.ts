import { z } from "@hono/zod-openapi";

import {
	createFlexibleSchema,
	type InferFlexible,
} from "#akigumo/shared/contracts/index.js";
import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";
import { UserStatus } from "#generated/prisma/enums.js";

export const UserRegistrationSchema = createFlexibleSchema(
	z.object({
		name: z.string().min(1, "名稱不能為空").openapi({
			description: "使用者名稱，至少 1 個字元",
			example: "Akigumo",
		}),
		redundancy: z
			.record(z.string(), z.any())
			.optional()
			.openapi({
				description: "自訂鍵值對 redundancy，可存放額外資訊",
				example: {
					source: "admin-panel",
					locale: "zh-TW",
				},
			}),
		status: z.enum(UserStatus).optional().openapi({
			description: "使用者狀態，未提供時由資料庫使用預設值",
			example: UserStatus.ACTIVE,
		}),
	}),
);

export type UserRegistration = InferFlexible<typeof UserRegistrationSchema>;

export const RequestSchema = UserRegistrationSchema.array;

export const ResponseSchema = BaseResponseSchema;

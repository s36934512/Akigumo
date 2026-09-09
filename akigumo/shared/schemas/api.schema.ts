import { z } from "@hono/zod-openapi";

const TracedResponseSchema = z.object({
	traceId: z.uuid().openapi({
		description: "Unique identifier for tracing the request through the system",
		example: "123e4567-e89b-12d3-a456-426614174000",
	}),
	status: z.string().openapi({
		description: "Response status indicating the result of the operation",
		example: "SUCCESS",
	}),
	message: z.string().optional().openapi({
		description:
			"Optional message providing additional information about the response",
		example: "Operation completed successfully",
	}),
});

const FaultResponseSchema = z.object({
	error: z.string().openapi({
		description: "Error message describing the reason for failure",
		example: "Invalid input data",
	}),
});

export const BaseResponseSchema = z
	.union([TracedResponseSchema, FaultResponseSchema])
	.openapi({
		description:
			"API response schema that can represent either a successful response with tracing information or a fault response with an error message",
		example: {
			traceId: "123e4567-e89b-12d3-a456-426614174000",
			status: "SUCCESS",
			message: "Operation completed successfully",
		},
	});

export type BaseResponse = z.infer<typeof BaseResponseSchema>;

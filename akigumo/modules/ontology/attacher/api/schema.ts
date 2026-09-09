import { BaseResponseSchema } from "#akigumo/shared/schemas/api.schema.js";

import { InputSchema } from "../core/processors.js";

export const RequestSchema = InputSchema;

/**
 * Schema for the standard API response envelope.
 *
 * Why: Ensures all responses conform to a consistent structure for error handling and client parsing.
 */
export const ResponseSchema = BaseResponseSchema;

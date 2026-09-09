import z from "zod";

export const DeletePayloadSchema = z.object({
	event: z.instanceof(Event),
	ids: z.object({ id: z.string() }).array(),
});
export type DeletePayload = z.infer<typeof DeletePayloadSchema>;

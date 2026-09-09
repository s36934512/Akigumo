import z from "zod";

export const UiTokenEnum = z.enum([
	"INSPECT_ITEM",
	"OPEN_SETTINGS",
	"OPEN_NAVIGATION",
	"OPEN_REGISTRY",
	"EXPANDED",
	"CLOSE_OVERLAY",
	"LEFT_SIDEBAR",
	"RIGHT_SIDEBAR",
	"DELETE",
]);

export const UiToken = UiTokenEnum.enum;

export const NullableUiTokenSchema = UiTokenEnum.nullable();

export type UiToken = z.infer<typeof UiTokenEnum>;
export type NullableUiToken = z.infer<typeof NullableUiTokenSchema>;

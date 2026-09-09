/**
 * @file Business logic for FILE_SEAL action
 *
 * SEAL bridges raw TUS bytes and structured workflow state:
 * 1. Probe the file to detect its real extension and MIME type.
 * 2. Compute the authoritative SHA-256 checksum for integrity validation.
 * 3. Persist extension + checksum to PostgreSQL before the machine branches.
 * 4. Return the processing strategy so the machine can route without an extra
 *    DB round-trip.
 *
 * Why probe and persist in one function?
 * Moving the file and probing its type are tightly coupled; probing a file
 * that has not yet been relocated would read stale data.
 */

import sharp from "sharp";

import * as Paths from "#akigumo/kernel/paths.js";
import { calculateChecksum } from "#akigumo/shared/utils/index.js";

import type { FILE_CATEGORY_STRATEGIES } from "../contract.js";

export function resolveStrategyKey(
	categoryCode: string | undefined,
): keyof typeof FILE_CATEGORY_STRATEGIES {
	const normalized = (categoryCode ?? "").trim().toUpperCase();

	if (normalized === "IMAGE") return "IMAGE";
	if (normalized === "ARCHIVE") return "ARCHIVE";
	if (normalized === "VIDEO") return "VIDEO";
	if (normalized === "AUDIO") return "AUDIO";
	if (normalized === "DOCUMENT" || normalized === "DOC") return "DOC";
	if (normalized === "OTHER" || normalized === "OTHERS") return "OTHERS";

	return "OTHERS";
}

/**
 * Convert the original file at basePath to a WebP derivative.
 */
export async function convertToWebp(fileDir: string) {
	const sourcePath = Paths.concat(fileDir, "original");
	const targetPath = Paths.concat(fileDir, "compressed.webp");

	const info = await sharp(sourcePath).webp().toFile(targetPath);
	const checksum = await calculateChecksum(targetPath);

	return {
		size: BigInt(info.size),
		checksum,
		width: info.width,
		height: info.height,
	};
}

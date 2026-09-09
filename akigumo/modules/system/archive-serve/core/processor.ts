import fs from "fs-extra";
import type { CommonId } from "#akigumo/shared/contracts/common.js";
import * as svc from "./service.js";

export async function systemArchiveServeProcessor(fileId: CommonId["single"]) {
	try {
		const metadata = await svc.getFileMatadata(fileId);

		const filePath = metadata.physicalPath;

		if (!filePath || !fs.pathExistsSync(filePath)) {
			return null;
		}

		return { filePath, mimeType: metadata.mimeType };
	} catch {
		return null;
	}
}

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { z } from "@hono/zod-openapi";
import fs from "fs-extra";
import pLimit from "p-limit";

import * as Paths from "#akigumo/kernel/paths.js";

const execFileAsync = promisify(execFile);
const CONCURRENCY_LIMIT = 20;

async function listFilesRecursively(dir: string) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const results: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...(await listFilesRecursively(fullPath)));
			continue;
		}
		if (entry.isFile()) {
			results.push(fullPath);
		}
	}

	return results;
}

export async function extractArchive(fileId: string, extensionCode: string) {
	const archivePath = Paths.concat("TMP_PROCESS", fileId, "original");
	const outputDir = Paths.concat("TMP_PROCESS", fileId, "extracted");
	const scriptPath = Paths.concat(
		"ROOT",
		"akigumo",
		"shared",
		"utils",
		"utils_py",
		"extract_archive.py",
	);

	await fs.ensureDir(outputDir);

	if (extensionCode !== "zip" && extensionCode !== "rar") {
		throw new Error(
			`Unsupported archive format: ${extensionCode || "unknown"}`,
		);
	}

	const normalizedArchivePath = Paths.concat(
		"TMP_PROCESS",
		fileId,
		`archive.${extensionCode}`,
	);
	await fs.copy(archivePath, normalizedArchivePath, { overwrite: true });

	// Keep python binary configurable for local/dev-container differences.
	const pythonCommand = process.env.PYTHON_BIN || "python3";
	try {
		await execFileAsync(pythonCommand, [
			scriptPath,
			normalizedArchivePath,
			outputDir,
		]);
	} finally {
		await fs.remove(normalizedArchivePath);
	}

	return await listFilesRecursively(outputDir);
}

const MassiveInputSchema = z
	.object({
		sourcePath: z.string(),
		targetPath: z.string(),
	})
	.array();

type MassiveInput = z.infer<typeof MassiveInputSchema>;

export async function moveMassiveFiles(files: MassiveInput) {
	try {
		const limit = pLimit(CONCURRENCY_LIMIT);
		const moveTasks = files.map((file) => {
			// 使用 limit 包裹非同步的 move 操作
			return limit(async () => {
				try {
					await fs.move(file.sourcePath, file.targetPath, {
						overwrite: true,
					});
				} catch (error) {
					console.error(`搬移失敗: ${file}`, error);
				}
			});
		});

		await Promise.all(moveTasks);
	} catch (err) {
		console.error("執行過程中發生重大錯誤:", err);
	}
}

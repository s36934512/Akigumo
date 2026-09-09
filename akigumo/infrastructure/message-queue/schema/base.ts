import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "@hono/zod-openapi";
import { Redis } from "ioredis";
import * as yaml from "yaml";

import type { Config } from "../types/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "..", "config.yaml");
const fileContents = fs.readFileSync(filePath, "utf8");
const config = yaml.parse(fileContents) as Config;

export const QueueConstructorSchema = z.object({
	name: z.string().min(1),
	group: z.string().min(1),
	trimIntervalSeconds: z
		.number()
		.int()
		.positive()
		.default(config.mq.trim_interval_seconds),
	redis: z.instanceof(Redis).optional(),
});

export type QueueConstructor = z.infer<typeof QueueConstructorSchema>;

export const WorkerConstructorSchema = QueueConstructorSchema.extend({
	batchSize: z.number().int().positive().default(config.mq.batch_size),
	minIdleTime: z.number().int().positive().default(config.mq.min_idle_time),
});

export type WorkerConstructor = z.infer<typeof WorkerConstructorSchema>;

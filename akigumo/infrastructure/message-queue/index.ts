import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "yaml";

import { WorkerConstructorSchema } from "./schema/index.js";
import type { Config } from "./types/config.js";
import { BatchWorker } from "./worker.js";

export { get_Jobs } from "./job.js";
export { MessageQueue } from "./queue.js";
export * from "./schema/index.js";
export { BatchWorker } from "./worker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "config.yaml");
const fileContents = fs.readFileSync(filePath, "utf8");
const config = yaml.parse(fileContents) as Config;

export const graphRefinementWorker = new BatchWorker(
	WorkerConstructorSchema.parse({
		name: config.mq.graph_stream_name,
		group: config.mq.graph_group_name,
	}),
);

export const workflowExecutionWorker = new BatchWorker(
	WorkerConstructorSchema.parse({
		name: config.mq.workflow_stream_name,
		group: config.mq.workflow_group_name,
		batchSize: 1,
	}),
);

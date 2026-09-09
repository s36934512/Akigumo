import * as process from "node:process";
import type pino from "pino";

import { logger } from "#akigumo/db/pino.js";

import { get_Jobs } from "./job.js";
import { MessageQueue } from "./queue.js";
import type { JobDict, WorkerConstructor } from "./schema/index.js";

export class BatchWorker extends MessageQueue {
	private workerName: string;
	private batchSize: number;
	private minIdleTime: number;
	private running: boolean = false;
	private log: pino.Logger;

	constructor(input: WorkerConstructor) {
		super({
			name: input.name,
			group: input.group,
			trimIntervalSeconds: input.trimIntervalSeconds,
			redis: input.redis,
		});
		this.workerName = `worker-${process.pid}`;
		this.batchSize = input.batchSize;
		this.minIdleTime = input.minIdleTime;
		this.log = logger.child({ label: "BatchWorker", queueName: this.name });
	}

	/**
	 * 處理一批訊息並批次 ACK
	 */
	private async handleBatch(
		messages: Array<[id: string, fields: string[]]>,
		handler: (jobs: JobDict[]) => Promise<void>,
	): Promise<void> {
		if (!messages || messages.length === 0) {
			return;
		}

		const jobs = get_Jobs(messages);

		try {
			await handler(jobs);

			const pipeline = this.redis.pipeline();
			for (const job of jobs) {
				pipeline.xack(this.name, this.group, job.id);
			}
			await pipeline.exec();

			this.log.debug(
				`Successfully processed and ACKed batch of ${jobs.length}`,
			);
		} catch (e) {
			this.log.error(`Batch processing failed: ${e}`);
			// 注意：這裡不 XACK，這些任務會留在 PEL 中，等待下次 XAUTOCLAIM 重新處理
		}
	}

	/**
	 * 啟動批次 Worker 迴圈
	 */
	public async run(
		handler: (jobs: JobDict[]) => Promise<void>,
	): Promise<void> {
		await this.setup();
		this.running = true;
		this.log.info(`started (batch_size=${this.batchSize})...`);

		while (this.running) {
			try {
				// 1. 檢查並處理 Stale Jobs (遺漏任務)
				// ioredis 中的 xautoclaim 回傳格式為: [next_start_id, [messages], [completed_ids]]
				const result = await this.redis.xautoclaim(
					this.name,
					this.group,
					this.workerName,
					this.minIdleTime,
					"0-0",
					"COUNT",
					this.batchSize,
				);

				const staleMessages = result ? result[1] : null;
				if (staleMessages && staleMessages.length > 0) {
					await this.handleBatch(staleMessages, handler);
				}

				// 2. 讀取新的一批任務
				// ioredis 的 xreadgroup 回傳格式為: [ [stream_name, [messages]], ... ]
				const response = await this.redis.xreadgroup(
					"GROUP",
					this.group,
					this.workerName,
					"COUNT",
					this.batchSize,
					"BLOCK",
					2000,
					"STREAMS",
					this.name,
					">",
				);

				if (response) {
					for (const [_, msgs] of response) {
						if (msgs && msgs.length > 0) {
							await this.handleBatch(msgs, handler);
						}
					}
				}
			} catch (e) {
				this.log.error(`Worker Loop Error: ${e}`);
				// 發生錯誤時等待 1 秒再重試，防止無限迴圈造成 CPU 飆高
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	}

	/**
	 * 停止 Worker
	 */
	public async stop(): Promise<void> {
		this.running = false;
		await this.close();
	}
}

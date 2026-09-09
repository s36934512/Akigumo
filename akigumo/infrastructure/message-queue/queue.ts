import type { Redis } from "ioredis";

import { redis } from "#akigumo/db/redisClient.js";

import type { QueueConstructor } from "./schema/index.js";

/**
 * 一個用於將任務推送到基於 Redis 的佇列的服務。
 * 此服務旨在由外部工作者 (例如 Python 腳本) 消費，這些工作者將批次處理任務。
 */
export class MessageQueue {
	protected readonly redis: Redis;
	protected readonly name: string;
	protected readonly group: string;
	private readonly trimIntervalSeconds: number;
	private trimTimer: NodeJS.Timeout | null = null;

	/**
	 * 初始化 MessageQueue。
	 * @param redisClient 一個已初始化的 ioredis 客戶端實例。
	 * @param queueName 用作任務佇列的 Redis 列表名稱。
	 */
	constructor(input: QueueConstructor) {
		this.redis = input.redis || redis;
		this.name = input.name;
		this.group = input.group;
		this.trimIntervalSeconds = input.trimIntervalSeconds;
	}

	public async setup(): Promise<void> {
		try {
			// XGROUP CREATE name group 0 MKSTREAM
			await this.redis.xgroup(
				"CREATE",
				this.name,
				this.group,
				"0",
				"MKSTREAM",
			);
		} catch (error: any) {
			// 檢查是否為 BUSYGROUP 錯誤（代表消費組已經存在）
			if (error instanceof Error && error.message.includes("BUSYGROUP")) {
				// 消費組已存在，安全跳過
			} else {
				throw error;
			}
		}

		this.safeTrimLoop();
	}

	private async safeTrimLoop(): Promise<void> {
		try {
			if (this.redis) {
				const pendingInfo = await this.redis.xpending(
					this.name,
					this.group,
					"-",
					"+",
					1,
				);

				if (pendingInfo && pendingInfo.length > 0) {
					const minPendingId = pendingInfo[0][0];
					await this.redis.xtrim(
						this.name,
						"MINID",
						"~",
						minPendingId,
					);
					console.log("安全修剪完成");
				}
			}
		} catch (error) {
			// 後台循環必須捕獲所有異常，防止因為單次網路波動導致整個清理線程死掉
			console.error(`安全修剪循環發生異常:`, error);
		}

		this.trimTimer = setTimeout(() => {
			this.safeTrimLoop();
		}, this.trimIntervalSeconds * 1000);
	}

	/**
	 * 新增消息到 Stream
	 */
	public async add(data: string): Promise<void> {
		if (!this.redis) {
			throw new Error("Redis connection is not established.");
		}

		await this.redis.xadd(this.name, "*", "payload", data);
	}

	// /**
	//  * 將一個新任務推送到 Redis 佇列的末尾。
	//  * 任務在存儲之前會被序列化為 JSON 字串。
	//  * @param type 任務的類型 (例如：'process_image', 'send_email')。
	//  * @param payload 與任務相關聯的數據。
	//  * @returns 一個 Promise，解析後返回被推送任務的 ID。
	//  * @throws {Error} 如果任務未能推送到佇列。
	//  */
	// public async add(type: string, payload: any): Promise<string> {
	//     // 生成一個唯一的任務 ID。
	//     const jobId = `${type}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
	//     const job = {
	//         id: jobId,
	//         taskVersion: 1, // 可選：用於未來的任務版本控制。
	//         taskType: type,
	//         taskPayload: payload,
	//     };

	//     try {
	//         const jobString = JSON.stringify(job);
	//         // RPUSH 將任務添加到列表的尾部。
	//         await this.redis.xadd(this.queue, '*', 'payload', jobString);
	//         logger.debug({ jobId, type, queueName: this.queue }, 'Job pushed to queue.');
	//         return jobId;
	//     } catch (error: any) {
	//         logger.error({ jobId, type, error, queueName: this.queue }, 'Failed to push job to queue.');
	//         throw new Error(`Failed to push job ${jobId} to queue '${this.queue}': ${error.message}`);
	//     }
	// }

	/**
	 * 檢索佇列中等待的任務數量。
	 * @returns 一個 Promise，解析後返回佇列的長度。
	 * @throws {Error} 如果無法檢索佇列長度。
	 */
	// public async getQueueLength(): Promise<number> {
	//     try {
	//         return await this.redisClient.llen(this.queueName);
	//     } catch (error: any) {
	//         logger.error({ error, queueName: this.queueName }, 'Failed to get queue length.');
	//         throw new Error(`Failed to get queue length for '${this.queueName}': ${error.message}`);
	//     }
	// }

	/**
	 * 清除佇列中的所有任務。請極其謹慎使用，因為此操作不可逆。
	 * @returns 一個 Promise，解析後返回被刪除的鍵的數量 (如果佇列存在，則應為 1)。
	 * @throws {Error} 如果無法清除佇列。
	 */
	// public async clearQueue(): Promise<number> {
	//     try {
	//         const deletedCount = await this.redisClient.del(this.queueName);
	//         logger.warn({ queueName: this.queueName, deletedCount }, 'Job queue cleared.');
	//         return deletedCount;
	//     } catch (error: any) {
	//         logger.error({ error, queueName: this.queueName }, 'Failed to clear queue.');
	//         throw new Error(`Failed to clear queue '${this.queueName}': ${error.message}`);
	//     }
	// }

	/**
	 * 關閉隊列，停止背景任務並釋放 Redis 連線
	 */
	public async close(): Promise<void> {
		if (this.trimTimer) {
			clearTimeout(this.trimTimer);
			this.trimTimer = null;
		}

		if (this.redis) {
			await this.redis.quit();
		}
	}
}

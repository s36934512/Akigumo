import "dotenv/config";
import { Client } from "pg";

import { logger } from "#akigumo/db/pino.js";

import { dispatchTasks } from "./dispatcher.js";

const OUTBOX_CHANNEL = "kernel_outbox_inserted";

/**
 * Starts PostgreSQL LISTEN/NOTIFY subscriber for outbox insert notifications.
 *
 * On each notification this triggers a pending-task scan as low-latency dispatch.
 */
export async function startOutboxListener() {
	const log = logger.child({ label: "OutboxListener" });

	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();

	await client.query(`LISTEN ${OUTBOX_CHANNEL}`);

	client.on("notification", async (msg) => {
		if (msg.channel === OUTBOX_CHANNEL) {
			await dispatchTasks().catch((err) =>
				log.error({ error: err }, "處理待辦任務失敗"),
			);
		}
	});

	log.info("PostgreSQL Notify 監聽中...");
}

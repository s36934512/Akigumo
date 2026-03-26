import 'dotenv/config';
import { logger } from 'akigumo/db/pino';
import { Client } from 'pg';

import { processPendingTask } from './dispatcher';

const OUTBOX_CHANNEL = 'kernel_outbox_inserted';

/**
 * Starts PostgreSQL LISTEN/NOTIFY subscriber for outbox insert notifications.
 *
 * On each notification this triggers a pending-task scan as low-latency dispatch.
 */
export async function startOutboxListener() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    await client.query(`LISTEN ${OUTBOX_CHANNEL}`);

    client.on('notification', async (msg) => {
        if (msg.channel === OUTBOX_CHANNEL) {
            await processPendingTask().catch(
                err => logger.error({ label: 'OutboxListener', error: err }, '處理待辦任務失敗')
            );
        }
    });

    logger.info({ label: 'OutboxListener' }, "PostgreSQL Notify 監聽中...");
}

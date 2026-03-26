import 'dotenv/config';
import { Client } from 'pg';
import { outboxQueue } from './outbox.queue';

export async function startOutboxListener() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    await client.query('LISTEN neo4j_outbox_channel');

    client.on('notification', async () => {
        await outboxQueue.add('trigger_process', {}, {
            jobId: 'singleton_trigger',
            removeOnComplete: true,
            removeOnFail: true
        });
    });
}
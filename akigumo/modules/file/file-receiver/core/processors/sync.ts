/**
 * @file Business logic for FILE_SYNC_NEO4J action
 */

import { z } from '@hono/zod-openapi';
import { neogma } from 'akigumo/db/neogma';
import { logger } from 'akigumo/db/pino';

import { FILE_ACTIONS, ReceiverNotifyPayloadSchema } from '../../../common/contract';
import { registerFileProcessor } from '../../../common/registry.helper';
import { FILE_RECEIVER_ACTIONS } from '../../contract';

const SyncFilePayloadSchema = z.array(z.object({
    fileId: z.uuid(),
    labels: z.array(z.string()).optional(),
    uploading: z.boolean().optional(),
}));


registerFileProcessor(
    FILE_RECEIVER_ACTIONS.SYNC,
    SyncFilePayloadSchema,
    async (data, metadata) => {
        if (data.length === 0) {
            logger.warn({ label: 'FILE_SYNC' }, `No file IDs found in trace: ${metadata.traceId}`);
            return { synced: 0 };
        }

        return { synced: 1 };
    }
);

registerFileProcessor(
    FILE_ACTIONS.RECEIVER_NOTIFY,
    ReceiverNotifyPayloadSchema,
    async (data) => {
        return data;
    }
);
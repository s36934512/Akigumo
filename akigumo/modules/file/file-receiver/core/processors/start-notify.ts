/**
 * @file Registers the FILE_INIT_ITEM processor with the kernel registry.
 *
 * Delegates to registerFileProcessor so this action stays fully contained
 * within the file slice – no direct kernel dependency needed here.
 */

import { z } from '@hono/zod-openapi';
import { prisma } from 'akigumo/db/prisma';
import {
    FILE_ACTIONS,
    FILE_AGGREGATE,
    FILE_PROCESS_ITEM_WORKFLOW_NAME
} from 'akigumo/modules/file/common/contract';
import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';

import { FILE_RECEIVER_ACTIONS } from '../../contract';

const PayloadSchema = z.array(z.object({
    fileId: z.uuid(),
}));

registerFileProcessor(
    FILE_RECEIVER_ACTIONS.START_NOTIFY,
    PayloadSchema,
    async (data) => {
        if (data.length === 0) return;

        await prisma.outbox.createMany({
            data: data.map(({ fileId }) => {
                const pendingTask = createPendingTask({
                    aggregateType: FILE_AGGREGATE,
                    operation: FILE_ACTIONS.INTEGRATION_START_NOTIFY.code,
                    payload: {
                        fileId: fileId,
                    }
                });

                return {
                    ...pendingTask,
                    workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
                    correlationId: fileId,
                };
            })
        });
    }
);

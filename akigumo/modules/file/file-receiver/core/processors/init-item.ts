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
    FILE_PROCESS_ITEM_WORKFLOW_NAME
} from 'akigumo/modules/file/common/contract';
import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';

import { FILE_RECEIVER_ACTIONS } from '../../contract';

const PayloadSchema = z.array(z.object({
    fileId: z.uuid(),
    parentId: z.uuid(),
    uncompressMaxDepth: z.number().int().min(0).default(3),
}));

registerFileProcessor(
    FILE_RECEIVER_ACTIONS.INIT_ITEM,
    PayloadSchema,
    async (data) => {
        await prisma.workflowState.createMany({
            data: data.map((task) => ({
                correlationId: task.fileId,
                workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
                status: 'INIT',
                tasks: {
                    fileId: task.fileId,
                    parentId: task.parentId,
                    operationCode: FILE_ACTIONS.RECEIVER_NOTIFY.code,
                    uncompressMaxDepth: task.uncompressMaxDepth,
                },
            })),
        });
    }
);

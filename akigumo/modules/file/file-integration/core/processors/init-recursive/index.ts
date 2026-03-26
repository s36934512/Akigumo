/**
 * @file Registers the FILE_INIT_RECURSIVE processor with the kernel registry.
 *
 * Each item in the payload bootstraps a fresh workflowState row so the
 * dispatcher can fan-out sub-workflows independently.
 */

import { prisma } from 'akigumo/db/prisma';
import { FILE_ACTIONS, FILE_PROCESS_ITEM_WORKFLOW_NAME } from 'akigumo/modules/file/common/contract';
import { FILE_AGGREGATE } from 'akigumo/modules/file/common/contract';
import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';
import { FILE_INTEGRATION_ACTIONS } from 'akigumo/modules/file/file-integration/contract';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';

import { RecursiveUncompressPayloadSchema as PayloadSchema } from './schema';
import { SealFilePayloadSchema } from '../seal/schema';

// Processor handler creates file-process items from parent's archive extract results
registerFileProcessor(
    FILE_INTEGRATION_ACTIONS.INIT_RECURSIVE,
    PayloadSchema,
    async (data) => {
        const fileIds = data.map((task) => task.fileId);
        const files = await prisma.file.findMany({
            where: { id: { in: fileIds } },
            select: {
                id: true,
                systemName: true,
                checksum: true,
            },
        });
        const fileById = new Map(files.map((file) => [file.id, file]));
        const outboxRows = data.map((task) => {
            const file = fileById.get(task.fileId);

            const payload = SealFilePayloadSchema.parse({
                fileId: task.fileId,
                fileName: file?.systemName ?? task.fileId,
                checksum: file?.checksum ?? '',
                basePath: task.basePath,
            });

            const sealTask = createPendingTask({
                aggregateType: FILE_AGGREGATE,
                operation: FILE_INTEGRATION_ACTIONS.SEAL.code,
                payload,
                correlationId: task.fileId,
            });

            return {
                aggregateType: sealTask.aggregateType,
                correlationId: task.fileId,
                workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
                operation: sealTask.operation,
                payload: sealTask.payload,
                status: sealTask.status,
            };
        });

        await prisma.$transaction(async (tx) => {
            await tx.workflowState.createMany({
                data: data.map((task) => ({
                    correlationId: task.fileId,
                    workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
                    status: 'INIT',
                    tasks: {
                        fileId: task.fileId,
                        parentId: task.parentId,
                        operationCode: FILE_ACTIONS.INTEGRATION_NOTIFY.code,
                        uncompressMaxDepth: task.uncompressMaxDepth,
                        basePath: task.basePath,
                    },
                })),
            });

            if (outboxRows.length > 0) {
                await tx.outbox.createMany({ data: outboxRows });
            }
        });
    },
);

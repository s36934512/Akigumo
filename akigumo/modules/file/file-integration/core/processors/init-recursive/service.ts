import { prisma } from "akigumo/db/prisma";
import {
    FILE_ACTIONS,
    FILE_PROCESS_ITEM_WORKFLOW_NAME
} from "akigumo/modules/file/common/contract";
import { FILE_AGGREGATE } from 'akigumo/modules/file/common/contract';
import { FILE_INTEGRATION_ACTIONS } from 'akigumo/modules/file/file-integration/contract';
import { createPendingTask } from 'akigumo/shared/schemas/machine.schema';

import {
    RecursiveUncompressPayload,
} from './schema';
import { MachineInputSchema } from "../../../machine/schema";
import { SealFilePayloadSchema } from "../seal/schema";

const WorkflowStateTasksSchema = MachineInputSchema.omit({ correlationId: true });

export async function startFileProcessWorkflow(data: RecursiveUncompressPayload) {
    const fileIds = data.map(d => d.fileId);
    const files = await prisma.file.findMany({
        where: { id: { in: fileIds } },
        select: { id: true, systemName: true, checksum: true },
    });

    const fileMap = new Map(files.map(f => [f.id, f]));

    // 2. 核心邏輯轉換：將 Input 轉換為系統內部的指令物件
    // 這裡體現「想法統一」：所有的任務都必須經過 Factory 標準化
    const commandContexts = data.map(task => {
        const file = fileMap.get(task.fileId);

        // 封裝任務建立細節
        const payload = SealFilePayloadSchema.parse({
            fileId: task.fileId,
            fileName: file?.systemName ?? task.fileId,
            checksum: file?.checksum ?? '',
            basePath: task.basePath,
        });
        const command = createPendingTask({
            aggregateType: FILE_AGGREGATE,
            operation: FILE_INTEGRATION_ACTIONS.SEAL.code,
            payload,
            correlationId: task.fileId,
        });

        return {
            task, // 保留原始資訊供寫入 workflowState
            command, // 供寫入 outbox
        };
    });

    await prisma.$transaction(async (tx) => {
        await tx.workflowState.createMany({
            data: commandContexts.map(({ task }) => ({
                correlationId: task.fileId,
                workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
                status: 'INIT',
                tasks: WorkflowStateTasksSchema.parse({
                    fileId: task.fileId,
                    parentId: task.parentId,
                    operationCode: FILE_ACTIONS.INTEGRATION_NOTIFY.code,
                    uncompressMaxDepth: task.uncompressMaxDepth,
                    basePath: task.basePath,
                }),
            })),
        });

        const outboxRows = commandContexts.map(({ command, task }) => ({
            aggregateType: command.aggregateType,
            correlationId: task.fileId,
            workflowId: FILE_PROCESS_ITEM_WORKFLOW_NAME,
            operation: command.operation,
            payload: command.payload,
            status: command.status,
        }));

        if (outboxRows.length > 0) {
            await tx.outbox.createMany({ data: outboxRows });
        }
    });
}
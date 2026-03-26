import { createActor } from 'xstate';
import { createUserMachine } from './create-user.machine';
import { CreateUserInput } from './create-user.schema';

import './audit.sync';
import './create-user.sync';
import { WorkflowRegistry } from '@server/core/workflow/workflow.registry';
import { prisma } from '@server/core/db/prisma';
import { ItemStatus, ItemType } from 'generated/prisma/client';
import { AggregateType, USER_ACTIONS } from './create-user.contract';
import { initializeWorkflow, workflowQueue } from '@server/core/workflow/workflow.kernel';

WorkflowRegistry.register({
    id: 'create-user',
    machine: createUserMachine
});

export async function createUserOrchestrator(userData: CreateUserInput) {
    console.log('=== [createUserOrchestrator] ===\n', userData);

    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                name: userData.name,
            }
        });
        await tx.account.create({
            data: {
                provider: 'local',
                providerUserId: user.id.toString(),
                user: { connect: { id: user.id } }
            }
        });
        const rootItem = await tx.item.create({
            data: {
                title: `root`,
                type: ItemType.COLLECTION,
                status: ItemStatus.ACTIVE,
            }
        });
        await tx.outbox.create({
            data: {
                aggregateType: AggregateType,
                operation: USER_ACTIONS.CREATED.code,
                payload: { userId: user.id, rootItemId: rootItem.id },
            }
        });

        return { userId: user.id };
    });

    const snapshot = await initializeWorkflow('create-user', result.userId, { ...userData });
    console.log('=== [createUserOrchestrator] 初始化完成，Snapshot: ===\n', snapshot);
}


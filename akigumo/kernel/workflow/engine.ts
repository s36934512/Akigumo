
import { logger } from "akigumo/db/pino";
import { prisma } from "akigumo/db/prisma";
import { EVENT_CODE_SUCCESS } from "akigumo/shared/contracts/event-codes.helper";

import { WorkflowRegistry } from "./registry";
import { workflowRepository } from "./repository";
import { StatusUpdate } from "../bootstrap/schema";
import { feedback$ } from "../feedback/feedback";
import { createActorFromState } from "../utils/workflow.bootstrapper";


/**
 * Starts workflow feedback subscription loop.
 *
 * For each status update this loads workflow state, rehydrates actor,
 * dispatches success/failure event, persists next snapshot, and enqueues
 * follow-up outbox task when `nextTask` is present.
 */
export const startWorkflowEngine = () => {
    logger.info({ label: 'WorkflowEngine' }, '狀態機引擎啟動，開始監聽回饋...');

    feedback$.subscribe(async (update: StatusUpdate) => {
        try {
            logger.info({ label: 'WorkflowEngine', update }, '狀態機引擎回饋');

            const dbState = await workflowRepository.find(update.correlationId);
            if (!dbState) return;

            const workflowId = dbState.workflowId;
            const machine = WorkflowRegistry.get(workflowId);
            if (!machine)
                return logger.warn({ label: 'WorkflowEngine', workflowId }, '未找到對應的狀態機，跳過處理');

            const actor = createActorFromState(machine, dbState);
            actor.start();

            const eventType = `${update.operation}_${update.result.status}`;
            if (update.result.status === EVENT_CODE_SUCCESS) {
                actor.send({ type: eventType, data: update.result.data });
            } else {
                const errorMessage = typeof update.result.error === 'string'
                    ? update.result.error
                    : 'Unknown processor error';
                actor.send({ type: eventType, error: errorMessage });
            }

            const nextSnapshot = actor.getSnapshot();
            const nextTask = nextSnapshot.context.nextTask;

            await prisma.$transaction(async (tx) => {
                await tx.workflowState.update({
                    where: { correlationId: update.correlationId },
                    data: {
                        status: nextSnapshot.context.status,
                        snapshot: nextSnapshot
                    }
                });

                if (nextTask) {
                    await tx.outbox.create({
                        data: {
                            correlationId: update.correlationId,
                            workflowId: workflowId,
                            ...nextTask,
                        }
                    });
                }
            });

            actor.stop();

        } catch (error) {
            if (error instanceof Error) {
                let parsedMessage;
                try {
                    parsedMessage = JSON.parse(error.message);
                } catch {
                    parsedMessage = error.message;
                }

                error = {
                    message: parsedMessage,
                    stack: error.stack
                };
            } else {
                error = { message: String(error) };
            }

            logger.error({ label: 'WorkflowEngine', error }, '處理回饋時發生錯誤');
        }
    });
};
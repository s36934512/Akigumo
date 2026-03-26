import { prisma } from "akigumo/db/prisma";

/**
 * Repository helpers for workflow-state persistence.
 */
export const workflowRepository = {
    /**
     * Creates or updates a workflow snapshot by correlation ID.
     */
    async persist(
        workflowId: string,
        correlationId: string,
        snapshot: any
    ) {
        return await prisma.workflowState.upsert({
            where: { correlationId },
            update: {
                snapshot,
                status: snapshot.status,
                workflowId
            },
            create: {
                correlationId,
                workflowId,
                snapshot,
                status: snapshot.status
            }
        });
    },

    /**
     * Finds workflow state by correlation ID.
     */
    async find(correlationId: string) {
        return await prisma.workflowState.findUnique({
            where: { correlationId }
        });
    }
};
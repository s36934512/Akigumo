import { prisma } from "../db/prisma";

export const WorkflowRepository = {
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

    async find(correlationId: string) {
        return await prisma.workflowState.findUnique({
            where: { correlationId }
        });
    }
};
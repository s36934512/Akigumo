import { logger } from "#akigumo/db/pino.js";
import { prisma } from "#akigumo/db/prisma.js";
import type { CommonIdObject } from "#akigumo/shared/contracts/index.js";
import { Prisma } from "#generated/prisma/client.js";

import { ARCHIVE_AGGREGATE } from "../../common/contract.js";
import { ACTION_LIST } from "../contract.js";

export async function updateFilePath({
	targetIdList,
	oldSegment,
	newSegment,
}: {
	targetIdList: string[];
	oldSegment: string;
	newSegment: string;
}) {
	await prisma.$queryRaw`
            UPDATE "file"
            SET "physical_path" = REPLACE("physical_path", ${oldSegment}, ${newSegment})
            WHERE "id" IN (${Prisma.join(targetIdList)})
                AND "physical_path" LIKE ${`%${oldSegment}%`};
        `;
}

export async function notifyParentWorkflowState(
	input: CommonIdObject["single"],
) {
	const workflow = await prisma.workflowState.findUnique({
		where: { id: input.id },
	});

	if (!workflow?.correlationId) {
		logger.warn(
			{ fileId: input.id },
			"No parent workflow found for notification",
		);

		return;
	}

	await prisma.outbox.create({
		data: {
			workflowId: workflow.correlationId,
			aggregateType: ARCHIVE_AGGREGATE,
			operation: ACTION_LIST.NOTIFY.code,
			payload: input,
		},
	});
}

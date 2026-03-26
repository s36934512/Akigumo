import Paths from "@server/core/paths";
import { SaveIntentInput } from "./create-file.schema";
import { DiskGuard } from "./disk-guard.utils";
import { prisma } from "@server/core/db/prisma";
import { FileStatus, ItemStatus, ItemType } from "generated/prisma/enums";
import { AggregateType, FILE_ACTIONS } from "./create-file.contract";

export const createFileIntent = async (input: SaveIntentInput) => {
    const { fileName, size, checksum, metadata } = input;

    const hasEnoughSpace = await DiskGuard.hasEnoughSpace(Paths.TMP_TUS, Number(size));
    if (!hasEnoughSpace) {
        throw new Error('磁碟空間不足，無法上傳檔案');
    }

    return await prisma.$transaction(async (tx) => {
        const file = await tx.file.create({
            data: {
                originalName: fileName,
                size: size,
                checksum: checksum,
                isOriginal: true,
                metadata: metadata,
                status: FileStatus.UPLOADING,
                fileExtension: {
                    connect: { code: 'bin' }
                }
            }
        });
        const item = await tx.item.create({
            data: {
                title: fileName,
                type: ItemType.FILE_CONTAINER,
                status: ItemStatus.PROCESSING,
            }
        });
        await tx.outbox.create({
            data: {
                aggregateType: AggregateType,
                operation: FILE_ACTIONS.INITIALIZED.code,
                payload: { fileId: file.id, itemId: item.id },
            }
        });

        return { fileId: file.id, itemId: item.id };
    });
};
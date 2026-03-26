import { z } from "@hono/zod-openapi";
import { prisma } from "akigumo/db/prisma";
import Paths from "akigumo/kernel/paths";
import { registerFileProcessor } from "akigumo/modules/file/common/registry.helper";
import { DiskGuard } from "akigumo/shared/utils";
import { FileStatus } from "generated/prisma/client";

import { FILE_RECEIVER_ACTIONS } from "../../../contract";

const TusIntentFileSchema = z.object({
    name: z.string(),
    size: z.preprocess((val) => BigInt(String(val)), z.bigint().positive()),
    checksum: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
}).openapi({
    example: {
        name: 'example.jpg',
        size: 102400,
        checksum: 'd3c617d9527eb9c0c6297e60319aef64c022059a47dfbfdef92ab45464720016',
        metadata: {
            description: 'An example file upload'
        }
    }
});

export const TusIntentInputSchema = z.object({
    notifyUploadId: z.uuid(),
    files: TusIntentFileSchema.or(z.array(TusIntentFileSchema))
}).openapi({
    example: {
        notifyUploadId: '123e4567-e89b-12d3-a456-426614174000',
        files: [
            {
                name: 'example.jpg',
                size: 102400,
                checksum: 'd3c617d9527eb9c0c6297e60319aef64c022059a47dfbfdef92ab45464720016',
                metadata: {
                    description: 'An example file upload'
                }
            }
        ]
    }
});

async function _getOrCreateDefaultExt() {
    return await prisma.fileExtension.upsert({
        where: { code: 'unknown' },
        update: {},
        create: {
            code: 'unknown',
            name: '未知格式',
            category: {
                connectOrCreate: {
                    where: { code: 'others' },
                    create: { code: 'others', name: '其他' },
                },
            },
        },
    });
}

registerFileProcessor(
    FILE_RECEIVER_ACTIONS.INTENT,
    TusIntentInputSchema,
    async (data) => {
        const files = Array.isArray(data.files) ? data.files : [data.files];
        const totalSize = files.reduce((acc, f) => acc + BigInt(f.size), BigInt(0));

        if (!(await DiskGuard.hasEnoughSpace(Paths.TMP_TUS, Number(totalSize)))) {
            throw new Error('[CRITICAL] 磁碟空間不足');
        }

        const defaultExt = await _getOrCreateDefaultExt();

        const createdFiles = await prisma.file.createManyAndReturn({
            data: files.map(f => ({
                originalName: f.name,
                size: BigInt(f.size),
                checksum: f.checksum,
                isOriginal: true,
                metadata: f.metadata,
                status: FileStatus.UPLOADING,
                fileExtensionId: defaultExt.id,
            }))
        });

        return {
            notifyUploadId: data.notifyUploadId,
            files: createdFiles
        };
    }
);
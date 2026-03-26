import { outboxRegistry, ProcessFn } from "@core/worker/outbox.registry";
import { prisma } from "@server/core/db/prisma";
import sharp from 'sharp';
import Paths from '@server/core/paths';
import { ProcessFilePayloadSchema } from "./create-file.schema";
import { FileStatus } from "generated/prisma/enums";
import crypto from 'crypto';
import fs from 'fs-extra';
import { pipeline } from 'stream/promises';
import { AggregateType, FILE_ACTIONS } from "./create-file.contract";

const processFile: ProcessFn = async (input) => {

    for (const item of input) {
        const { fileId, mimeType } = ProcessFilePayloadSchema.parse(item.payload);

        const isImage = mimeType.startsWith('image/');
        const isAlreadyWebp = mimeType === 'image/webp';

        if (isImage && !isAlreadyWebp) {
            try {
                console.log(`[Worker] 正在處理轉檔: ${fileId}...`);

                // --- 這裡寫轉檔邏輯 ---
                const sourcePath = Paths.concat('STORAGE_ORIGINALS', fileId, 'original');
                const targetPath = Paths.concat('STORAGE_ORIGINALS', fileId, 'compressed.webp');
                const info = await sharp(sourcePath).webp().toFile(targetPath);
                // --------------------

                const hash = crypto.createHash('sha256');
                const readStream = fs.createReadStream(targetPath);

                // 使用 pipeline 確保串流正確關閉並處理錯誤
                await pipeline(readStream, hash);
                const checksum = hash.digest('hex');

                await prisma.$transaction(async (tx) => {
                    const file = await tx.file.update({
                        where: { id: fileId },
                        data: {
                            status: FileStatus.AVAILABLE
                        }
                    });

                    const derivativeFile = await tx.file.create({
                        data: {
                            systemName: `compressed.webp`,
                            size: info.size,
                            checksum: checksum,
                            status: FileStatus.AVAILABLE,
                            fileExtension: {
                                connect: { code: 'webp' }
                            },
                        }
                    });

                });
            } catch (error) {
                console.error(`[Worker] 轉檔失敗: ${fileId}`, error);
                throw error;
            }
        }
    }
};

outboxRegistry.register(AggregateType, FILE_ACTIONS.UPLOADED.code, processFile);
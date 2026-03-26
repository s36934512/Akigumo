import { z } from '@hono/zod-openapi'
import { FileCreateInputObjectSchema } from 'generated/zod/schemas';
import FileRepository from '../../data/repositories/file.repository';
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { ContextService } from '@core/context/context.service';
import DatabaseCacheRepository from '@core/database-cache.repository';
import AuditService from '@core/audit/domain/services/audit.service';

interface FileMutationServiceDeps {
    fileRepository: FileRepository;
    databaseCacheRepository: DatabaseCacheRepository;
    auditService: AuditService;
    prisma: ExtensionPrisma;
}

export default class FileMutationService {
    constructor(private deps: FileMutationServiceDeps) { }

    private get fileRepository() { return this.deps.fileRepository; }
    private get cacheRepository() { return this.deps.databaseCacheRepository; }
    private get auditService() { return this.deps.auditService; }
    private get prisma() { return this.deps.prisma; }

    private get baseContext() {
        const ctx = ContextService.getContext();
        return {
            userId: ctx?.userId,
            sessionId: ctx?.sessionId,
        };
    }

    // [TODO] update, delete
    async createFilePlaceholder(data: z.infer<typeof FileCreateInputObjectSchema>) {
        const ctx = this.baseContext;

        try {
            await this.prisma.$transaction(async (tx) => {
                await ContextService.setContext({ ...ctx, tx }, async () => {
                    const createdFile = await this.fileRepository.create(data, tx);

                    await this.auditService.logFileCreation(createdFile.id, createdFile.originalName || 'unknown');

                    await this.cacheRepository.set({
                        namespace: 'file',
                        key: createdFile.id,
                        value: { originalName: createdFile.originalName || 'unknown' },
                    }, tx);
                });

                // [TODO] neoSync 寫入邏輯
            });
        } catch (err) {
            throw err;
        }
    }
}

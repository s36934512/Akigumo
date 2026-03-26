import { z } from '@hono/zod-openapi'
import { Prisma } from 'generated/prisma/client';
import { FileCategoryCreateInputObjectSchema, FileCreateInputObjectSchema, FileExtensionCreateInputObjectSchema } from 'generated/zod/schemas';
import { AppTransactionClient } from '@core/infrastructure/database/prisma';
import PrismaBase from '@core/base.repository';
import { FileUpdateInputObjectSchema } from 'generated/zod/schemas/objects/FileUpdateInput.schema';

interface FileRepositoryDeps {
    baseRepository: PrismaBase;
}

export default class FileRepository {
    constructor(private deps: FileRepositoryDeps) { }

    private get prismaBase(): PrismaBase { return this.deps.baseRepository; }

    /**
     * 建立檔案紀錄
     */
    public async create(
        data: z.infer<typeof FileCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('file', (model) => model.create({ data }), tx);
    }

    /**
     * 根據 ID 查詢檔案
     */
    public async findById(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('file', (model) => model.findUnique({ where: { id } }), tx);

    }

    public async findMany(
        params: {
            where?: Prisma.FileWhereInput;
            orderBy?: Prisma.FileOrderByWithRelationInput | Prisma.FileOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, take, skip } = params;
        return await this.prismaBase.execute(
            'file',
            (model) => model.findMany({ where, orderBy, take, skip }),
            tx
        );
    }

    public async update(
        id: string,
        data: z.infer<typeof FileUpdateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('file', (model) => model.update({ where: { id }, data }), tx);
    }

    /**
     * 刪除檔案
     */
    public async delete(
        id: string,
        tx?: AppTransactionClient
    ) {
        if (!z.uuidv7().safeParse(id).success) {
            return null;
        }
        return await this.prismaBase.execute('file', (model) => model.delete({ where: { id } }), tx);
    }

    public async findExtensionByCode(
        code: string,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute('fileExtension', (model) => model.findUnique({ where: { code } }), tx);
    }

    public async findFileExtensionByType(mimeType: string) {
        return await this.prismaBase.execute('fileExtension', (model) => model.findFirst({ where: { mimeType } }));
    }

    public async createExtension(
        data: z.infer<typeof FileExtensionCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute(
            'fileExtension',
            (model) => model.create({ data }),
            tx
        );
    }

    /**
     * 建立檔案分類
     */
    public async createFileCategory(
        data: z.infer<typeof FileCategoryCreateInputObjectSchema>,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute(
            'fileCategory',
            (model) => model.create({ data }),
            tx
        );
    }

    /**
     * 查詢檔案分類
     */
    public async findFileCategoryUnique(
        where: Prisma.FileCategoryWhereUniqueInput,
        tx?: AppTransactionClient
    ) {
        return await this.prismaBase.execute(
            'fileCategory',
            (model) => model.findUnique({ where }),
            tx
        );
    }

    public async findFileCategory(
        params: {
            where?: Prisma.FileCategoryWhereInput;
            orderBy?: Prisma.FileCategoryOrderByWithRelationInput | Prisma.FileCategoryOrderByWithRelationInput[];
            take?: number;
            skip?: number;
        } = {},
        tx?: AppTransactionClient
    ) {
        const { where, orderBy, take, skip } = params;
        return await this.prismaBase.execute(
            'fileCategory',
            (model) => model.findMany({ where, orderBy, take, skip }),
            tx
        );
    }


}

import { Prisma } from 'generated/prisma/client';

export type PrismaTranslatedError = {
    status: 409;
    message: string;
};

/**
 * Why a generator?
 * Keeping entity naming outside the translator allows one shared mapping
 * for Prisma error codes while preserving domain-specific API wording.
 */
export const translatePrismaError = (entityName: string) => {
    return (error: unknown): PrismaTranslatedError | null => {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
            return null;
        }

        if (error.code === 'P2002') {
            return {
                status: 409,
                message: `${entityName}已存在`
            } as const;
        }

        return null;
    };
};
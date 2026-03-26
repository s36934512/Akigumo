import { z } from "@hono/zod-openapi";
import { ActionCategory, Severity } from "generated/prisma/enums";
import {
    InitializedFileAuditPayloadSchema,
    InitializedFileGraphPayloadSchema,
    InitializedFilePayloadSchema,
    ProcessFileAuditPayloadSchema,
    ProcessFileGraphPayloadSchema,
    ProcessFilePayloadSchema,
    SyncFileAuditPayloadSchema,
    SyncFileGraphPayloadSchema,
    SyncFilePayloadSchema,
    UploadedFileAuditPayloadSchema,
    UploadedFileGraphPayloadSchema,
    UploadedFilePayloadSchema,
} from "./create-file.schema";

export interface ActionInput<
    P extends z.ZodType = z.ZodType,
    A extends z.ZodType = z.ZodType,
    G extends z.ZodType = z.ZodType,
> {
    name: string;
    category: ActionCategory;
    severity: Severity;
    description?: string;

    payloadSchema: P;
    schemas?: {
        audit?: A;
        graph?: G;
    };
}

function createActions<T extends Record<string, ActionInput<any, any, any>>>(actions: T) {
    return Object.freeze(
        Object.fromEntries(
            Object.entries(actions).map(([key, value]) => [
                key,
                { ...value, code: key }
            ])
        )
    ) as { readonly [K in keyof T]: T[K] & { readonly code: K } } & ActionInput<any, any, any>;
}

export const FILE_ACTIONS = createActions({
    INITIALIZED: {
        name: '建立檔案意圖',
        category: ActionCategory.FILE_IO,
        severity: Severity.MEDIUM,
        payloadSchema: InitializedFilePayloadSchema,
        schemas: {
            audit: InitializedFileAuditPayloadSchema,
            graph: InitializedFileGraphPayloadSchema,
        }
    },
    UPLOADED: {
        name: '檔案上傳完成',
        category: ActionCategory.FILE_IO,
        severity: Severity.MEDIUM,
        payloadSchema: UploadedFilePayloadSchema,
        schemas: {
            audit: UploadedFileAuditPayloadSchema,
            graph: UploadedFileGraphPayloadSchema,
        }
    },
    PROCESSED: {
        name: '檔案處理完成',
        category: ActionCategory.FILE_IO,
        severity: Severity.MEDIUM,
        payloadSchema: ProcessFilePayloadSchema,
        schemas: {
            audit: ProcessFileAuditPayloadSchema,
            graph: ProcessFileGraphPayloadSchema,
        }
    },
    SYNCED: {
        name: '檔案圖譜同步完成',
        category: ActionCategory.FILE_IO,
        severity: Severity.MEDIUM,
        payloadSchema: SyncFilePayloadSchema,
        schemas: {
            audit: SyncFileAuditPayloadSchema,
            graph: SyncFileGraphPayloadSchema,
        }
    },
});

export const AggregateType = "FILE" as const;

export type ActionCode = Extract<keyof typeof FILE_ACTIONS, string>;

export type GetPayload<
    C extends ActionCode,
    P extends keyof NonNullable<typeof FILE_ACTIONS[C]['schemas']> | 'default' = 'default'
> = P extends 'default'
    ? (typeof FILE_ACTIONS[C] extends { payloadSchema: z.ZodType<infer T> } ? T : never)
    : (typeof FILE_ACTIONS[C] extends { schemas: { [K in P]: z.ZodType<infer T> } } ? T : never);

export type ActionKey = `${typeof AggregateType}:${ActionCode}`;
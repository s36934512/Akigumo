export const OUTBOX_DEFS = {
    AGGREGATE: {
        ITEM: 'ITEM',
        USER: 'USER',
        ENTITY: 'ENTITY',
        FILE: 'FILE',
    },
    OPERATION: {
        ITEM_CREATED: 'ITEM_CREATED',
        USER_CREATED: 'USER_CREATED',
        ENTITY_CREATED: 'ENTITY_CREATED',
        FILE_CREATED: 'FILE_CREATED',
        FILE_PROCESSED: 'FILE_PROCESSED',
        UPLOAD_COMPLETE: 'UPLOAD_COMPLETE',
    }
} as const;
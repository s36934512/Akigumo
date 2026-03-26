export const ACTORS = {
    SAVE_USER: 'db:saveUser',
    SAVE_ITEM: 'db:saveItem',
    SAVE_ENTITY: 'db:saveEntity',
    SAVE_INTENT: 'db:saveIntent',
    SAVE_FILE: 'db:saveFile',
    WAIT_UPLOAD: 'upload:wait',
    WAIT_PROC: 'proc:wait',
    WAIT_SYNC: 'graph:sync',
} as const;

// 2. States (生命週期/階段)
export const STATES = {
    SUCCESS: 'success',
    FAILED: 'failed',

    SAVING_USER: 'savingUser',
    SAVING_ITEM: 'savingItem',
    SAVING_ENTITY: 'savingEntity',
    SAVING_INTENT: 'savingIntent',
    SAVING_FILE: 'savingFile',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    SYNCING: 'syncingGraph',
} as const;
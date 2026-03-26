/**
 * Item Index Stream 模組契約
 */
export const ITEM_INDEX_AGGREGATE = 'ITEM_INDEX' as const;

export const ITEM_INDEX_ACTIONS = {
    CREATE_BOOTSTRAP_SNAPSHOT: {
        code: 'INDEX_BOOTSTRAP_GENERATE',
        name: '建立索引全量快照',
    },
    NOTIFY_INDEX_PATCH: {
        code: 'INDEX_PATCH_NOTIFY',
        name: '推送索引增量更新',
    }
} as const;

export const INDEX_STREAM_WORKFLOW_NAME = 'ITEM_INDEX_STREAM_FLOW_V1' as const;
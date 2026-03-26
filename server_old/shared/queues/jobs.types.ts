/**
 * 定義各個隊列中具體的任務名稱
 */
export const JOBS = {
    // 通知類任務
    NOTIFICATION: {
        SEND_WELCOME_EMAIL: 'send_welcome_email',
        SEND_PASSWORD_RESET: 'send_password_reset',
        SEND_SMS_OTP: 'send_sms_otp',
    },

    // 檔案類任務
    FILE: {
        GENERATE_THUMBNAIL: 'generate_thumbnail',
        CLEANUP_TEMP_FILES: 'cleanup_temp_files',
    },

    // 認證類任務
    AUTH: {
        INIT_USER_NODE: 'init_user_node', // 在 Neo4j 中建立使用者節點
        SYNC_USER_DATA: 'sync_user_data', // 同步使用者資料到第三方服務
    },

    SYNC: {
        FILE: 'outbox:neo4j:file',
        USER: 'outbox:neo4j:user',
        ITEM: 'outbox:neo4j:item',
    }
} as const;
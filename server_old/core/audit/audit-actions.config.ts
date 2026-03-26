import { z } from 'zod';
import { Severity } from 'generated/prisma/enums';

export const ACTION_REGISTRY = {
    node_create: {
        name: '新增資源',
        description: '建立新的檔案或資料夾節點',
        category: 'FILE_IO',
        severity: Severity.MEDIUM,
        schema: z.object({ fileName: z.string() })
    },
    node_rename: {
        name: '重新命名',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.LOW,
        schema: z.object({})
    },
    node_move: {
        name: '移動位置',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.LOW,
        schema: z.object({})
    },
    node_copy: {
        name: '複製資源',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.LOW,
        schema: z.object({})
    },
    node_delete: {
        name: '移至回收桶 (軟刪除)',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    node_restore: {
        name: '還原資源',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    node_permanent_delete: {
        name: '永久刪除資料',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    node_empty_trash: {
        name: '清空回收桶',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    node_upload: {
        name: '上傳資源',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'FILE_IO',
        severity: Severity.MEDIUM,
        schema: z.object({ fileName: z.string(), batchId: z.string().optional() })
    },
    node_download: {
        name: '下載資源',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'FILE_IO',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    node_toggle_pin: {
        name: '置頂/取消置頂',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.LOW,
        schema: z.object({})
    },
    node_toggle_hide: {
        name: '隱藏/取消隱藏',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.LOW,
        schema: z.object({})
    },
    node_share_link_create: {
        name: '建立分享連結',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    node_share_link_delete: {
        name: '取消分享連結',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'DATA_OP',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    node_permission_update: {
        name: '變更節點權限',
        description: '通用節點操作 (檔案與資料夾皆適用)',
        category: 'SECURITY',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    file_create_init: {
        name: '檔案建立初始化',
        description: '開始建立檔案，尚未完成實體檔案內容的寫入',
        category: 'FILE_IO',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    file_preview: {
        name: '預覽檔案',
        description: '檔案專屬操作 (涉及實體檔案內容)',
        category: 'FILE_IO',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    file_overwrite: {
        name: '覆蓋內容',
        description: '檔案專屬操作 (涉及實體檔案內容)',
        category: 'FILE_IO',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    file_version_restore: {
        name: '還原至舊版本',
        description: '檔案專屬操作 (涉及實體檔案內容)',
        category: 'FILE_IO',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    folder_create: {
        name: '建立資料夾',
        description: '資料夾專屬結構操作',
        category: 'DATA_OP',
        severity: Severity.LOW,
        schema: z.object({})
    },
    folder_merge: {
        name: '合併資料夾',
        description: '資料夾專屬結構操作',
        category: 'DATA_OP',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    folder_set_quota: {
        name: '設定空間配額',
        description: '資料夾專屬結構操作',
        category: 'SYSTEM',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    folder_calculate_size: {
        name: '重新計算資料夾容量',
        description: '資料夾專屬結構操作',
        category: 'SYSTEM',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    user_login: {
        name: '使用者登入',
        description: '使用者進行登入操作',
        category: 'AUTH',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    user_logout: {
        name: '使用者登出',
        description: '使用者進行登出操作',
        category: 'AUTH',
        severity: Severity.LOW,
        schema: z.object({})
    },
    user_register: {
        name: '使用者註冊',
        description: '新使用者註冊帳號',
        category: 'AUTH',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    user_password_change: {
        name: '變更密碼',
        description: '使用者變更密碼',
        category: 'SECURITY',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    user_lock: {
        name: '鎖定帳號',
        description: '系統或管理員鎖定使用者帳號',
        category: 'SECURITY',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    user_unlock: {
        name: '解除鎖定帳號',
        description: '系統或管理員解除鎖定',
        category: 'SECURITY',
        severity: Severity.MEDIUM,
        schema: z.object({})
    },
    system_backup: {
        name: '系統備份',
        description: '執行系統資料備份',
        category: 'SYSTEM',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    system_restore: {
        name: '系統還原',
        description: '執行系統資料還原',
        category: 'SYSTEM',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    data_export: {
        name: '資料匯出',
        description: '匯出資料至外部',
        category: 'DATA_OP',
        severity: Severity.HIGH,
        schema: z.object({})
    },
    data_import: {
        name: '資料匯入',
        description: '從外部匯入資料',
        category: 'DATA_OP',
        severity: Severity.HIGH,
        schema: z.object({})
    },
} as const;

export type ActionCode = keyof typeof ACTION_REGISTRY;

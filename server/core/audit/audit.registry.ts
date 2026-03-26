import { z } from '@hono/zod-openapi'
import { ENTITY_ACTIONS } from '@modules/entity/create-entity/create-entity.contract';
import { FILE_ACTIONS } from '@modules/file/create-file/create-file.contract';
import { ITEM_ACTIONS } from '@modules/item/create-item/create-item.contract';
import { USER_ACTIONS } from '@modules/user/create-user/create-user.contract';

export const ALL_ACTIONS = {
    ENTITY: ENTITY_ACTIONS,
    FILE: FILE_ACTIONS,
    ITEM: ITEM_ACTIONS,
    USER: USER_ACTIONS,
} as const;


// 取得所有領域名稱: "ITEM" | "ENTITY" | "FILE" | "USER"
export type AggregateType = keyof typeof ALL_ACTIONS;

// 取得特定領域下的所有動作: ActionCode<"ITEM"> -> "CREATE" | "MOVE"
export type ActionCode<T extends AggregateType> = Extract<keyof typeof ALL_ACTIONS[T], string>;

// 自動推導 Payload 型別: GetPayload<"ITEM", "CREATE">
export type GetPayload<
    T extends AggregateType,
    C extends ActionCode<T>,
    P extends string | 'default' = 'default'
> = P extends 'default'
    ? (typeof ALL_ACTIONS[T][C] extends { payloadSchema: z.ZodType<infer D> } ? D : never)
    : (typeof ALL_ACTIONS[T][C] extends { schemas: { [K in P]: z.ZodType<infer S> } } ? S : never);


// 用於 Outbox 表的統一 Action String (例如 "ITEM:CREATE")
export type GlobalActionKey = { [T in AggregateType]: `${T}:${ActionCode<T>}` }[AggregateType];
// export const ACTION_REGISTRY = {
//     /**
//      * ITEM 領域：處理虛擬目錄結構 (WORK, SERIES, COLLECTION, FILE_CONTAINER)
//      */
//     ITEM: {
//         CREATE: {
//             name: '建立項目',
//             description: '建立 WORK/SERIES/COLLECTION 等虛擬節點',
//             category: 'DATA_OP',
//             severity: Severity.LOW,
//             payloadSchema: ItemCreateSchema,
//         },
//         MOVE: {
//             name: '移動項目',
//             description: '變更項目在虛擬目錄中的位置',
//             category: 'DATA_OP',
//             severity: Severity.LOW,
//             payloadSchema: ItemMoveSchema,
//         },
//         // ... 其他如 DELETE, RENAME
//     },

//     /**
//      * ENTITY 領域：作者、標籤、時間戳記
//      */
//     ENTITY: {
//         CREATE: {
//             name: '建立實體',
//             description: '建立作者、標籤或自定義時間戳記',
//             category: 'DATA_OP',
//             severity: Severity.LOW,
//             payloadSchema: EntityCreateSchema,
//         },
//         UPDATE: {
//             name: '更新標籤內容',
//             description: '修改作者、標籤或自定義時間戳記',
//             category: 'DATA_OP',
//             severity: Severity.LOW,
//             payloadSchema: EntityUpdateSchema,
//         },
//     },

//     /**
//      * FILE 領域：處理實體檔案與 FILE_CONTAINER 的映射
//      */
//     FILE: {
//         INTENT: {
//             name: '建立檔案意圖',
//             description: '建立檔案意圖以便後續處理',
//             category: 'FILE_IO',
//             severity: Severity.MEDIUM,
//             payloadSchema: FileIntentSchema,
//         },
//         CREATE: {
//             name: '建立檔案',
//             description: '建立實體檔案並與虛擬 Item 關聯',
//             category: 'FILE_IO',
//             severity: Severity.MEDIUM,
//             payloadSchema: FileCreateSchema,
//         },
//         BIND_PHYSICAL: {
//             name: '綁定實體檔案',
//             description: '將儲存路徑與虛擬 Item 關聯',
//             category: 'FILE_IO',
//             severity: Severity.MEDIUM,
//             payloadSchema: FileBindSchema,
//         },
//     },

//     /**
//      * USER 領域：帳號、權限與 Session
//      */
//     USER: {
//         REGISTER: {
//             name: '使用者註冊',
//             category: 'AUTH',
//             severity: Severity.MEDIUM,
//             payloadSchema: UserRegisterSchema,
//         },
//         LOGIN: {
//             name: '登入',
//             category: 'AUTH',
//             severity: Severity.LOW,
//             payloadSchema: UserLoginSchema,
//         },
//     },
// } as const;

// 2. 重新定義 Action 配置介面
// interface ActionConfig<T extends z.ZodTypeAny> {
//     name: string;
//     description: string;
//     category: 'FILE_IO' | 'DATA_OP' | 'SECURITY' | 'AUTH' | 'SYSTEM';
//     severity: Severity;
//     payloadSchema: T; // 存入 Outbox 的資料格式
// }

// export const ACTION_REGISTRY = {
//     node_create: {
//         name: '新增資源',
//         description: '建立新的檔案或資料夾節點',
//         category: 'FILE_IO',
//         severity: Severity.MEDIUM,
//         schema: z.object({ fileName: z.string() })
//     },
//     node_rename: {
//         name: '重新命名',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     node_move: {
//         name: '移動位置',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     node_copy: {
//         name: '複製資源',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     node_delete: {
//         name: '移至回收桶 (軟刪除)',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     node_restore: {
//         name: '還原資源',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     node_permanent_delete: {
//         name: '永久刪除資料',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     node_empty_trash: {
//         name: '清空回收桶',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     node_upload: {
//         name: '上傳資源',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'FILE_IO',
//         severity: Severity.MEDIUM,
//         schema: z.object({ fileName: z.string(), batchId: z.string().optional() })
//     },
//     node_download: {
//         name: '下載資源',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'FILE_IO',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     node_toggle_pin: {
//         name: '置頂/取消置頂',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     node_toggle_hide: {
//         name: '隱藏/取消隱藏',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     node_share_link_create: {
//         name: '建立分享連結',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     node_share_link_delete: {
//         name: '取消分享連結',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'DATA_OP',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     node_permission_update: {
//         name: '變更節點權限',
//         description: '通用節點操作 (檔案與資料夾皆適用)',
//         category: 'SECURITY',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     file_create_init: {
//         name: '檔案建立初始化',
//         description: '開始建立檔案，尚未完成實體檔案內容的寫入',
//         category: 'FILE_IO',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     file_preview: {
//         name: '預覽檔案',
//         description: '檔案專屬操作 (涉及實體檔案內容)',
//         category: 'FILE_IO',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     file_overwrite: {
//         name: '覆蓋內容',
//         description: '檔案專屬操作 (涉及實體檔案內容)',
//         category: 'FILE_IO',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     file_version_restore: {
//         name: '還原至舊版本',
//         description: '檔案專屬操作 (涉及實體檔案內容)',
//         category: 'FILE_IO',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     folder_create: {
//         name: '建立資料夾',
//         description: '資料夾專屬結構操作',
//         category: 'DATA_OP',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     folder_merge: {
//         name: '合併資料夾',
//         description: '資料夾專屬結構操作',
//         category: 'DATA_OP',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     folder_set_quota: {
//         name: '設定空間配額',
//         description: '資料夾專屬結構操作',
//         category: 'SYSTEM',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     folder_calculate_size: {
//         name: '重新計算資料夾容量',
//         description: '資料夾專屬結構操作',
//         category: 'SYSTEM',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     user_login: {
//         name: '使用者登入',
//         description: '使用者進行登入操作',
//         category: 'AUTH',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     user_logout: {
//         name: '使用者登出',
//         description: '使用者進行登出操作',
//         category: 'AUTH',
//         severity: Severity.LOW,
//         schema: z.object({})
//     },
//     user_register: {
//         name: '使用者註冊',
//         description: '新使用者註冊帳號',
//         category: 'AUTH',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     user_password_change: {
//         name: '變更密碼',
//         description: '使用者變更密碼',
//         category: 'SECURITY',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     user_lock: {
//         name: '鎖定帳號',
//         description: '系統或管理員鎖定使用者帳號',
//         category: 'SECURITY',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     user_unlock: {
//         name: '解除鎖定帳號',
//         description: '系統或管理員解除鎖定',
//         category: 'SECURITY',
//         severity: Severity.MEDIUM,
//         schema: z.object({})
//     },
//     system_backup: {
//         name: '系統備份',
//         description: '執行系統資料備份',
//         category: 'SYSTEM',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     system_restore: {
//         name: '系統還原',
//         description: '執行系統資料還原',
//         category: 'SYSTEM',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     data_export: {
//         name: '資料匯出',
//         description: '匯出資料至外部',
//         category: 'DATA_OP',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
//     data_import: {
//         name: '資料匯入',
//         description: '從外部匯入資料',
//         category: 'DATA_OP',
//         severity: Severity.HIGH,
//         schema: z.object({})
//     },
// } as const;

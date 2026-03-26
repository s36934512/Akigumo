import { z } from 'zod';

export const SYSTEM_EVENT_TYPE_REGISTRY = {
    file_op: {
        code: 'file_op',
        name: '檔案操作',
    },
    database: {
        code: 'database',
        name: '資料庫',
    },
    application: {
        code: 'application',
        name: '應用程式',
    },
    security: {
        code: 'security',
        name: '安全',
    },
    network: {
        code: 'network',
        name: '網路',
    },
    system: {
        code: 'system',
        name: '系統',
    },
    disk_scan: {
        code: 'disk_scan',
        name: '硬碟掃描',
    },
    data_save: {
        code: 'data_save',
        name: '資料保存',
    },
    other: {
        code: 'other',
        name: '其他',
    },
} as const;

export type SystemEventTypeCode = keyof typeof SYSTEM_EVENT_TYPE_REGISTRY;

export const SYSTEM_EVENT_REGISTRY = {
    file_created: {
        code: 'file_created',
        name: '檔案建立',
        systemEventTypeCode: 'file_op',
        schema: z.object({ fileName: z.string() })
    },
    file_deleted: {
        code: 'file_deleted',
        name: '檔案刪除',
        systemEventTypeCode: 'file_op',
        schema: z.object({ fileName: z.string() })
    },
    file_renamed: {
        code: 'file_renamed',
        name: '檔案重新命名',
        systemEventTypeCode: 'file_op',
        schema: z.object({ oldName: z.string(), newName: z.string() })
    },
    file_downloaded: {
        code: 'file_downloaded',
        name: '檔案下載',
        systemEventTypeCode: 'file_op',
        schema: z.object({ fileName: z.string() })
    },
    startup: {
        code: 'startup',
        name: '系統啟動',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    shutdown: {
        code: 'shutdown',
        name: '系統關閉',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    restart: {
        code: 'restart',
        name: '系統重啟',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    update: {
        code: 'update',
        name: '系統更新',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    error: {
        code: 'error',
        name: '發生錯誤',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    maintenance_scheduled: {
        code: 'maintenance_scheduled',
        name: '預定維護',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    maintenance_completed: {
        code: 'maintenance_completed',
        name: '維護完成',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    performance_degraded: {
        code: 'performance_degraded',
        name: '效能降低',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    partial_outage_detected: {
        code: 'partial_outage_detected',
        name: '部分中斷偵測',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    major_outage_detected: {
        code: 'major_outage_detected',
        name: '重大中斷偵測',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    recovery_completed: {
        code: 'recovery_completed',
        name: '恢復完成',
        systemEventTypeCode: 'system',
        schema: z.object({})
    },
    disk_scan_started: {
        code: 'disk_scan_started',
        name: '硬碟掃描開始',
        systemEventTypeCode: 'disk_scan',
        schema: z.object({})
    },
    disk_scan_completed: {
        code: 'disk_scan_completed',
        name: '硬碟掃描完成',
        systemEventTypeCode: 'disk_scan',
        schema: z.object({})
    },
    data_found_on_disk: {
        code: 'data_found_on_disk',
        name: '硬碟發現待保存資料',
        systemEventTypeCode: 'data_save',
        schema: z.object({})
    },
    data_saved_to_db: {
        code: 'data_saved_to_db',
        name: '資料保存進資料庫',
        systemEventTypeCode: 'data_save',
        schema: z.object({})
    },
    other: {
        code: 'other',
        name: '其他',
        systemEventTypeCode: 'other',
        schema: z.object({})
    },
} as const;

export type SystemEventCode = keyof typeof SYSTEM_EVENT_REGISTRY;

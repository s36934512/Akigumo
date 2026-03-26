/**
 * 定義所有 BullMQ 隊列的名稱
 */
export const QUEUE_NAMES = {
    AUTH: 'auth-queue',
    NEO_SYNC: 'neo-sync-queue',
    NEO_SYNC_PULSE: 'neo-sync-pulse-queue',
    NEO_SYNC_SUMMARY: 'neo-sync-summary-queue',
    FILE_PROCESS: 'file-process-queue',
} as const; // 使用 as const 確保型別不會被更動
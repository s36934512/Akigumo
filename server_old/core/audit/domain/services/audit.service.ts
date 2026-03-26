import { z } from 'zod';
import { ActionStatus } from 'generated/prisma/enums';
import { ACTION_REGISTRY, ActionCode } from '../../audit-actions.config';
import AuditLogRepository from '../../data/repositories/auditLog.repository';
import { AuditLogCreateInputObjectSchema } from 'generated/zod/schemas';
import { ContextService } from '@core/context/context.service';

export interface AuditServiceDeps {
    auditLogRepository: AuditLogRepository;
}

export default class AuditService {
    constructor(private deps: AuditServiceDeps) { }

    private get auditLogRepository() { return this.deps.auditLogRepository; }

    private get baseContext() {
        const ctx = ContextService.getContext();
        return {
            userId: ctx?.userId,
            sessionId: ctx?.sessionId,
            tx: ctx?.tx,
        };
    }

    /**
     * 通用 Audit Log 寫入方法
     * @param input 需符合 AuditLogCreateInputObjectSchema 的物件
     */
    async writeAuditLog(input: z.infer<typeof AuditLogCreateInputObjectSchema>) {
        const client = this.baseContext.tx;
        return await this.auditLogRepository.create(input, client);
    }

    async logFileCreation(fileId: string, fileName: string) {
        const code = 'file_create_init' as ActionCode;
        const userId = this.baseContext.userId || 'unknown';
        const auditLogData = {
            payload: {
                userId,
                fileId,
                fileName,
            },
            correlationId: fileId,
            status: ActionStatus.PENDING,
            severity: ACTION_REGISTRY[code].severity,
            session: {
                connect: { id: this.baseContext.sessionId }
            },
            action: {
                connect: { code }
            },
        };
        return this.writeAuditLog(auditLogData);
    }

    // 傳送 User Audit
    // async logUser<T extends ActionCode>(
    //     sessionId: string | undefined,
    //     code: T,
    //     payload: z.infer<typeof ACTION_REGISTRY[T]['schema']>,
    //     options?: { status?: ActionStatus; severity?: Severity; correlationId?: string; message?: string }
    // ) {
    //     // 從 context 自動取得 sessionId/correlationId

    //     const resolvedSessionId = sessionId || undefined;
    //     const resolvedCorrelationId = options?.correlationId || undefined;
    //     await this._push({
    //         type: 'audit-log',
    //         code,
    //         payload: {
    //             sessionId: resolvedSessionId,
    //             logPayload: payload,
    //             status: options?.status || ActionStatus.SUCCESS,
    //             correlationId: resolvedCorrelationId,
    //             message: options?.message
    //         }
    //     });
    // }

    // 傳送 System Event
    // async logSystem<T extends SystemEventCode>(
    //     code: T,
    //     payload: z.infer<typeof SYSTEM_EVENT_REGISTRY[T]['schema']>,
    //     options?: { status?: SystemStatus; correlationId?: string; source?: string; message?: string }
    // ) {
    //     const resolvedCorrelationId = options?.correlationId || undefined;
    //     await this._push({
    //         type: 'system-event',
    //         code,
    //         payload: {
    //             logPayload: payload,
    //             correlationId: resolvedCorrelationId,
    //             status: options?.status || SystemStatus.UNKNOWN,
    //             source: options?.source || 'SYSTEM',
    //             message: options?.message,
    //         }
    //     });
    // }


    /**
     * 通用的檔案操作日誌處理器
     * @param auth 使用者識別碼或 Authorization Header
     * @param action 操作名稱 (如: 'node_upload', 'file_delete')
     * @param upload tus 的 upload 物件
     * @param status 操作狀態 (ActionStatus.SUCCESS 或 FAILED)
     * @param errorMsg 可選的錯誤訊息
     */
    // async logTusAction(
    //     auth: string,
    //     upload: Upload,
    //     status: ActionStatus,
    //     errorMsg?: string
    // ) {
    //     // 1. 集中處理從 upload 物件提取資料的邏輯
    //     const filename = upload.metadata?.filename ?? 'unknown';
    //     const batchId = upload.metadata?.batchId ?? undefined;

    //     // 2. 組合 message
    //     const defaultMsg = {
    //         [ActionStatus.SUCCESS]: 'Operation completed',
    //         [ActionStatus.FAILED]: 'Operation failed',
    //         [ActionStatus.RUNNING]: 'Operation in progress',
    //         [ActionStatus.PENDING]: 'Operation pending',
    //     }[status];

    //     const finalMessage = errorMsg ? `${defaultMsg}: ${errorMsg}` : defaultMsg;

    //     // 3. 呼叫原本底層的 logUser
    //     try {
    //         return await this.logUser(
    //             auth,
    //             'node_upload',
    //             {
    //                 fileName: filename,
    //                 batchId: batchId,
    //             },
    //             {
    //                 status: status,
    //                 message: finalMessage,
    //                 correlationId: upload.id,
    //             }
    //         );
    //     }
    //     catch (err) {
    //         console.error('[AuditService] logTusAction failed:', err);
    //         return null;
    //     }
    // }
}
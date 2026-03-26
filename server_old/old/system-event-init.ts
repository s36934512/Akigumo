
import { ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { SYSTEM_EVENT_REGISTRY, SystemEventCode, SYSTEM_EVENT_TYPE_REGISTRY } from './system-events.config';

export const systemEventIdMap = new Map<SystemEventCode, number>();

/**
 * 啟動器：同步資料庫並建立 SystemEvent ID 快取
 */
export async function initSystemEventService(prisma: ExtensionPrisma) {
    console.log('[SystemEvent] 正在同步 SystemEventType 定義...');
    // 1. 先 upsert 所有 SystemEventType
    for (const typeKey of Object.keys(SYSTEM_EVENT_TYPE_REGISTRY) as (keyof typeof SYSTEM_EVENT_TYPE_REGISTRY)[]) {
        const typeConfig = SYSTEM_EVENT_TYPE_REGISTRY[typeKey];
        await prisma.systemEventType.upsert({
            where: { code: typeConfig.code },
            update: { name: typeConfig.name },
            create: { code: typeConfig.code, name: typeConfig.name },
        });
    }
    console.log('[SystemEvent] SystemEventType 定義已同步');

    // 2. 再 upsert 所有 SystemEvent
    console.log('[SystemEvent] 正在同步 SystemEvent 定義...');
    for (const code of Object.keys(SYSTEM_EVENT_REGISTRY) as SystemEventCode[]) {
        const config = SYSTEM_EVENT_REGISTRY[code];
        const event = await prisma.systemEvent.upsert({
            where: { code },
            update: {
                name: config.name,
                systemEventType: {
                    connect: { code: config.systemEventTypeCode },
                },
            },
            create: {
                code,
                name: config.name,
                systemEventType: {
                    connect: { code: config.systemEventTypeCode },
                },
            },
        });
        systemEventIdMap.set(code, event.id);
    }
    console.log('[SystemEvent] 同步完成，SystemEvent 定義已快取');
}

import { ITEM_DEFAULT } from './item-default.config';
import NeoSyncService from '@core/neo-sync/neo-sync.service';
import ItemRepository from '../data/repositories/item.repository';
import NeoSyncOrchestrator from '@server/core/neo-sync/neo-sync.orchestrator';

interface ItemDefaultInit {
    itemRepository: ItemRepository;
    neoSyncService: NeoSyncService;
    neoSyncOrchestrator: NeoSyncOrchestrator;
}

/**
 * 啟動器：同步資料庫並建立預設項目
 */
export default async function initItemDefault(deps: ItemDefaultInit) {
    const { itemRepository, neoSyncService, neoSyncOrchestrator } = deps;

    console.log('[Item] 正在同步預設項目...');

    for (const item of ITEM_DEFAULT) {
        const existingItem = await itemRepository.findFirst({
            where: { title: item.title },
        });

        if (!existingItem) {
            await itemRepository.create({
                title: item.title,
                description: item.description,
                metadata: item.metadata,
                type: item.type,
                status: item.status,
            });
        }
    }

    //  neoSyncService.triggerSync('item');
    await neoSyncOrchestrator.executeSync('item');
    console.log('[Item] 同步完成');
}

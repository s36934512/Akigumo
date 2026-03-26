import ItemNeoRepository from '../../data/repositories/item.neo-repository';
import ItemRepository from '../../data/repositories/item.repository';

interface ItemQueryServiceDeps {
    itemRepository: ItemRepository;
    itemNeoRepository: ItemNeoRepository;
}

export default class ItemQueryService {
    constructor(private deps: ItemQueryServiceDeps) { }

    private get itemRepository() { return this.deps.itemRepository; }
    private get itemNeoRepository() { return this.deps.itemNeoRepository; }

    private async _getItems(params: any = {}) {
        return this.itemRepository.findMany(params);
    }

    async getRootSummary(userId: string) {
        let allItems = [];
        let hasMore = true;
        let lastOrder: number = -1;
        const pageSize = 5000;

        while (hasMore) {
            const getResult = await this.itemNeoRepository.getItems({ userId, options: { pageSize, lastOrder } });
            console.log(`getItems result: ${JSON.stringify(getResult)}`); // Debug: 查看 getItems 的原始結果
            const items = getResult.map(item => item.result.items).flat();

            allItems.push(...items);
            hasMore = items.length === pageSize;
            if (items.length > 0 && hasMore) {
                lastOrder = items[items.length - 1].order;
            }
            console.log(`Fetched ${items.length} items, items: ${JSON.stringify(items)}`); // Debug: 查看每次查詢的結果
        };
        console.log(allItems); // Debug: 查看最終獲取的所有項目
        const result = await this._getItems({ where: { id: allItems.map(item => item.id) } });

        return { entries: result, total_count: result.length };
    }

    async getItemsById(userId: string, itemId: string) {
        return this.itemNeoRepository.getItems({ userId, itemId });
    }
}

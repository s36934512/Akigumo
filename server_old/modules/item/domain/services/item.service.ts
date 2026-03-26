import { ItemStatusSchema, ItemTypeSchema } from "generated/zod/schemas";
import { z } from "@hono/zod-openapi";
import NeoSyncService from "@core/neo-sync/neo-sync.service";
import ItemRepository from "../../data/repositories/item.repository";
import { CreateItemRequestSchema } from "libs/contract/zod/item/v1/create-item.schema";
import NeoSyncOrchestrator from "@server/core/neo-sync/neo-sync.orchestrator";

interface ItemServiceDeps {
    itemRepository: ItemRepository;
    neoSyncService: NeoSyncService;
    neoSyncOrchestrator: NeoSyncOrchestrator;
}

export default class ItemService {
    constructor(private deps: ItemServiceDeps) { }

    private get itemRepository(): ItemRepository { return this.deps.itemRepository; }
    private get neoSyncService(): NeoSyncService { return this.deps.neoSyncService; }
    private get neoSyncOrchestrator(): NeoSyncOrchestrator { return this.deps.neoSyncOrchestrator; }

    async create(
        data: z.infer<typeof CreateItemRequestSchema>,
    ) {
        const { type, status } = data;
        const defaultStatus = {
            [ItemTypeSchema.enum.WORK]: ItemStatusSchema.enum.ONGOING,
            [ItemTypeSchema.enum.FILE_CONTAINER]: ItemStatusSchema.enum.ACTIVE,
            [ItemTypeSchema.enum.SERIES]: ItemStatusSchema.enum.ONGOING,
            [ItemTypeSchema.enum.COLLECTION]: ItemStatusSchema.enum.ACTIVE,
        }[type];

        await this.itemRepository.create({
            title: data.title,
            description: data.description,
            metadata: data.metadata,
            type: type,
            status: status ?? defaultStatus,
        });

        // this.neoSyncService.triggerSync('item');
        this.neoSyncOrchestrator.executeSync('item');
    }
}
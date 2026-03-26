import { setupIoC } from '../../../../ioc';
import { connectNeo4j } from '@server/core/infrastructure/database/neogma';

interface SetupServiceDeps {
    // 在這裡定義 SetupService 可能需要的依賴，例如：
    // userService: UserService;
    // itemService: ItemService;
    // fileService: FileService;
    // cacheService: CacheService;

}

export default class SetupService {


    async setup() {
        // 1. 初始化 IoC 容器，註冊所有依賴

        // 2. 其他 setup 邏輯（如資料同步、快取初始化等）可在這裡執行
        // await this.initializeCache();
        // await this.syncInitialData();

        await connectNeo4j(); // 確保 Neo4j 連線在啟動前已建立
    }
}
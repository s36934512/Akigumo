import { USER_DEFAULT } from './user-default.config';
import NeoSyncService from '@core/neo-sync/neo-sync.service';
import UserRepository from '../data/repositories/user.repository';
import NeoSyncOrchestrator from '@server/core/neo-sync/neo-sync.orchestrator';

interface UserDefaultInit {
    userRepository: UserRepository;
    neoSyncService: NeoSyncService;
    neoSyncOrchestrator: NeoSyncOrchestrator;
}

/**
 * 啟動器：同步資料庫並建立分類/副檔名 ID 快取
 */
export default async function userDefaultInit(deps: UserDefaultInit) {
    const { userRepository, neoSyncService, neoSyncOrchestrator } = deps;

    console.log('[User] 正在同步預設使用者...');

    for (const user of USER_DEFAULT) {
        const existingUser = await userRepository.findFirst({
            where: { name: user.name },
        });

        if (!existingUser) {
            await userRepository.create({
                name: user.name,
            });
        }
    }

    // await neoSyncService.triggerSync('user');
    await neoSyncOrchestrator.executeSync('user');
    console.log('[User] 同步完成');
}

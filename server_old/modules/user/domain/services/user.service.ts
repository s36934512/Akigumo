import { z } from "@hono/zod-openapi";
import { UserStatus } from 'generated/prisma/client'
import { AppTransactionClient, ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { hashPassword } from '@shared/utils/password';
import UserRepository from '@modules/user/data/repositories/user.repository';
import NeoSyncService from '@core/neo-sync/neo-sync.service';
import NeoSyncOrchestrator from "@server/core/neo-sync/neo-sync.orchestrator";
// import { CreateUserRequestSchema } from '@modules/user';

interface UserServiceDeps {
    userRepository: UserRepository;
    neoSyncService: NeoSyncService;
    neoSyncOrchestrator: NeoSyncOrchestrator;
    prisma: ExtensionPrisma;
}

export default class UserService {
    constructor(private deps: UserServiceDeps) { }

    private get userRepository(): UserRepository { return this.deps.userRepository; }
    private get neoSyncService(): NeoSyncService { return this.deps.neoSyncService; }
    private get neoSyncOrchestrator(): NeoSyncOrchestrator { return this.deps.neoSyncOrchestrator; }
    private get prisma(): ExtensionPrisma { return this.deps.prisma; }



    // async getUserById(id: string) {
    //     return this.userRepository.findById(id);
    // }

    // async getUsers(params: {
    //     where?: Prisma.UserWhereInput;
    //     orderBy?: Prisma.UserOrderByWithRelationInput;
    //     take?: number;
    //     skip?: number;
    // } = {}) {
    //     return this.userRepository.findMany(params);
    // }

    // async updateUser(id: string, data: z.infer<typeof UserUpdateInputObjectSchema>) {
    //     return this.userRepository.update(id, data);
    // }

    // async deleteUser(id: string) {
    //     return this.userRepository.delete(id);
    // }

    /**
     * 註冊新用戶：包含建立 User、Account 以及派發圖形資料庫同步任務
     */
    async registerUser(data: any) {
        const { name, providerUserId, password } = data;

        // 1. 執行資料庫事務
        const { user, account } = await this.prisma.$transaction(async (tx: AppTransactionClient) => {
            const newUser = await this.userRepository.create({
                name: name,
                status: UserStatus.ACTIVE
            }, tx);

            const newAccount = await tx.account.create({
                data: {
                    provider: 'LOCAL',
                    providerUserId,
                    passwordHash: await hashPassword(password),
                    userId: newUser.id,
                    status: UserStatus.ACTIVE
                }
            });

            return { user: newUser, account: newAccount };
        });

        // 2. 事務成功後，派發異步任務 (非同步，不影響主執行緒)
        // 這裡就是為什麼我們要注入 AuthDispatcher 的原因
        this.neoSyncOrchestrator.executeSync('user');

        return { user, account };
    }
}

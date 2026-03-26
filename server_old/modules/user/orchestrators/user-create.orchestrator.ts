import { UserStatus } from 'generated/prisma/client'
import { AppTransactionClient, ExtensionPrisma } from '@core/infrastructure/database/prisma';
import { hashPassword } from '@shared/utils/password';
// import { TYPES } from 'server/old/types/types';
// import { NeoSyncService } from '@core/neo-sync';

export class UserCreateOrchestrator {
    constructor(
        private readonly prisma: ExtensionPrisma,
        //   private readonly neoSyncService: NeoSyncService,
    ) { }

    async startCreateFlow(data: any) {
        const { name, sessionId } = data;

        // await uploadFlowProducer.add({
        //     name: 'save-to-db-and-audit',
        //     queueName: 'file-audit-queue',
        //     data: { sessionId },
        //     children: [
        //         {
        //             name: 'move-and-checksum', // 第一步
        //             queueName: 'file-processing-queue',
        //         },
        //     ],
        // });
    }

    async registerUser(data: any) {
        const { name, providerUserId, password } = data;

        const { user, account } = await this.prisma.$transaction(async (tx: AppTransactionClient) => {
            const newUser = await tx.user.create({
                data: {
                    name,
                    status: UserStatus.ACTIVE
                }
            });

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

        // await this.neoSyncService.triggerSync('user');

        return { user, account };
    }
}

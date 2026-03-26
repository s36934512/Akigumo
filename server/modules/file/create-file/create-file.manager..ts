import { createActor, type AnyActorRef } from 'xstate';
import { createFileMachine } from './create-file.machine';
import { CreateFileInput } from './create-file.schema';

class FileMachineRegistry {
    // 使用 Map 儲存：key 是 id, value 是 Actor 實例
    private actors = new Map<string, AnyActorRef>();

    /**
     * 取得或建立狀態機實例
     */
    getOrCreate(id: string, input?: CreateFileInput) {
        if (this.actors.has(id)) {
            return this.actors.get(id)!;
        }

        if (!input) {
            throw new Error(`FileMachineRegistry: No input provided for creating new actor with id ${id}`);
        }

        // 建立新的 Actor
        const actor = createActor(createFileMachine, { input });

        // 啟動狀態機
        actor.start();

        // 存入 Map
        this.actors.set(id, actor);

        // 訂閱狀態：當走到終點（success/failure）時，把自己從 Map 刪除
        actor.subscribe((state) => {
            if (state.matches('SUCCESS') || state.matches('FAILED')) {
                console.log(`[Registry] Cleaning up actor for file: ${id}`);
                this.actors.delete(id);
            }
        });

        return actor;
    }

    /**
     * 單純取得現有的 Actor (用於 POST_FINISH)
     */
    get(id: string) {
        return this.actors.get(id);
    }

    /**
     * 手動移除 (可選)
     */
    delete(id: string) {
        const actor = this.actors.get(id);
        actor?.stop();
        this.actors.delete(id);
    }
}

// 導出單例
export const fileMachineRegistry = new FileMachineRegistry();
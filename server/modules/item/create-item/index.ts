import { createActor } from 'xstate';
import { createItemMachine } from './create-item.machine';
import { CreateItemInput } from './create-item.schema';

import './create-item.sync';
import './audit.sync';

export async function createItemOrchestrator(itemData: CreateItemInput) {
    const actor = createActor(createItemMachine, {
        input: { ...itemData }
    });
    actor.subscribe((state) => {
        console.log('目前狀態:', state.value);

        if (state.status === 'done') {
            console.log('流程結束，正在釋放資源...');
            actor.stop();
        }
    });
    actor.start();
    console.log('=== [createItemOrchestrator] ===', itemData);
}

import { createActor } from 'xstate';
import { createEntityMachine } from './create-entity.machine';
import { CreateEntityInput } from './create-entity.schema';

import './create-entity.sync';
import './audit.sync';

export async function createEntityOrchestrator(entityData: CreateEntityInput) {
    const actor = createActor(createEntityMachine, {
        input: { ...entityData }
    });
    actor.subscribe((state) => {
        console.log('目前狀態:', state.value);

        if (state.status === 'done') {
            console.log('流程結束，正在釋放資源...');
            actor.stop();
        }
    });
    actor.start();
    console.log('=== [createEntityOrchestrator] ===', entityData);
}

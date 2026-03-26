import { logger } from 'akigumo/db/pino';

import { processPendingTask } from './event/dispatcher';
import { startOutboxListener } from './event/listener';
import { setupKernelWorker } from './processors/worker';
import { startWorkflowEngine } from './workflow/engine';

export * from './bootstrap/schema';
export * from './workflow/registry';
export { processPendingTask } from './event/dispatcher';
export { kernelProcessorsRegistry } from './event/registry';

/**
 * Bootstraps all kernel runtime components.
 *
 * Startup order:
 * 1. Workflow engine subscription
 * 2. BullMQ worker
 * 3. PostgreSQL notify listener
 * 4. Periodic outbox polling fallback
 */
export async function bootstrap() {
    startWorkflowEngine();
    setupKernelWorker();
    startOutboxListener();
    setInterval(async () => {
        await processPendingTask();
    }, 5000);

    logger.info("秋雲 Akigumo 系統內核已完全啟動");
}

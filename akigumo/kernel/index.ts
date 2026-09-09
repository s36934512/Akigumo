import { logger } from "#akigumo/db/pino.js";

import { dispatchTasks } from "./processors/dispatcher.js";
import { startOutboxListener } from "./processors/listener.js";
import { setupKernelWorker } from "./processors/worker.js";
import { startWorkflowEngine } from "./workflow/engine.js";

export { dispatchTasks } from "./processors/dispatcher.js";
export { NonRetryableError } from "./processors/error.js";
export * as kernelProcessorsRegistry from "./processors/registry.js";
export * as workflowRegistry from "./workflow/registry.js";

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
		await dispatchTasks();
	}, 5000);

	logger.info({ label: "Kernel" }, "秋雲 Akigumo 系統內核已完全啟動");
}

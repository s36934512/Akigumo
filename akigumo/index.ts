import { serve } from "@hono/node-server";

import { logger as pinoLogger } from "./db/pino.js";
import * as kernel from "./kernel/index.js";
import {
	registerArchiveConceptCapability,
	registerArchiveDeleteCapability,
	registerArchiveIntegrationCapability,
	registerArchiveUploadCapability,
} from "./modules/archive/index.js";
import {
	registerOntologyDeleteCapability,
	registerOntologyEditorCapability,
	registerOntologyRegistryCapability,
} from "./modules/ontology/index.js";
import { registerUserRegistrationCapability } from "./modules/user/index.js";
import "./modules/graph/graph-sync/index.js";
import app from "./routes.js";
import { syncFileExtensions } from "./shared/seed/index.js";

(BigInt.prototype as any).toJSON = function () {
	return this.toString();
};

const bootstrap = kernel.bootstrap();
const sync = syncFileExtensions();

registerArchiveConceptCapability();
registerArchiveDeleteCapability();
registerArchiveIntegrationCapability();
registerArchiveUploadCapability();

registerOntologyDeleteCapability();
registerOntologyEditorCapability();
registerOntologyRegistryCapability();

registerUserRegistrationCapability();

serve({
	fetch: app.fetch,
	port: 3049,
});

await bootstrap;
await sync;

pinoLogger.info({ label: "Akigumo" }, "Core Modules Loaded");

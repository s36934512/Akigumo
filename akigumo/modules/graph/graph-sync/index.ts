import { ACTIONS } from "./contracts.js";
import "./core/processors.js";
import "./handler/index.js";

export function createSyncIntentOutbox(handlerName: string, payload: unknown) {
	return {
		aggregateType: "GRAPH",
		operation: ACTIONS.INTENT_CREATED.code,
		payload: {
			handlerName,
			payload,
		},
	};
}

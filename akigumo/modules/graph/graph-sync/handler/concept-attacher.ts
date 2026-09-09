import _ from "lodash";

import { handlersRegistry } from "../core/index.js";
import {
	buildConceptAttacherTask,
	EntrySchema,
	type MapEntry,
} from "../factory/concept-attacher.js";

const PayloadSchema = EntrySchema.array();

handlersRegistry.registerHandler({
	name: "concept-attacher",
	schema: PayloadSchema,
	logic: async (payload) => {
		const entrise = payload;
		console.dir(entrise, { depth: null });
		const item = new Map<string, MapEntry>();
		const concept = new Map<string, MapEntry>();

		for (const { targetIds, ...obj } of entrise) {
			for (const target of targetIds) {
				if (target.type === "item") {
					const result = item.get(target.id);

					const command = { targetId: target.id, ...obj };
					if (result) {
						const merged = _.mergeWith(
							{},
							result,
							command,
							(objValue, srcValue) => {
								if (_.isArray(objValue)) {
									const combinedArray =
										objValue.concat(srcValue);

									return [...new Set(combinedArray)];
								}
							},
						);
						item.set(target.id, merged);
					} else {
						item.set(target.id, command);
					}
				} else if (target.type === "concept") {
					const result = concept.get(target.id);

					const command = { targetId: target.id, ...obj };
					if (result) {
						const merged = _.mergeWith(
							{},
							result,
							command,
							(objValue, srcValue) => {
								if (_.isArray(objValue)) {
									const combinedArray =
										objValue.concat(srcValue);

									return [...new Set(combinedArray)];
								}
							},
						);
						concept.set(target.id, merged);
					} else {
						concept.set(target.id, command);
					}
				}
			}
		}

		const itemList = Array.from(item.values());
		const conceptList = Array.from(concept.values());

		return {
			taskType: "ConceptAttacherExecutor",
			payload: buildConceptAttacherTask({
				itemList,
				conceptList,
			}),
		};
	},
});

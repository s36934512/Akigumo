import { z } from "@hono/zod-openapi";
import _ from "lodash";
import { v5 as uuidv5, v7 as uuidv7 } from "uuid";

import {
	type ConceptRegistry,
	ONTOLOGY_NAMESPACE,
} from "#akigumo/shared/contracts/index.js";

import {
	type AttachAttributes,
	AttachAttributesSchema,
	AttributesSchema,
	type TargetId,
} from "../schema/schema.js";

const PartialAttributesScehma = AttachAttributesSchema.single.omit({
	targetIds: true,
	customAttributes: true,
});
type PartialAttributes = z.infer<typeof PartialAttributesScehma>;

const PartialCustomAttributesSchema = AttributesSchema.single.extend({
	value: z.uuid().array(),
});
type PartialCustomAttributes = z.infer<typeof PartialCustomAttributesSchema>;

function splitConcept(input: AttachAttributes["array"]) {
	const entryIds: string[] = [];
	const targetMap = new Map<string, TargetId[]>();
	const attributesMap = new Map<string, PartialAttributes>();
	const customMap = new Map<string, PartialCustomAttributes[]>();
	const conceptMap = new Map<string, ConceptRegistry["single"]>();

	for (const entry of input) {
		const { targetIds, customAttributes, ...obj } = entry;

		const entryId = uuidv7();
		entryIds.push(entryId);
		targetMap.set(entryId, targetIds);
		attributesMap.set(entryId, obj);

		const customObjects = [];
		for (const { key, value } of customAttributes ?? []) {
			const conceptIds = value.map((concept) => {
				const conceptId = uuidv7();
				conceptMap.set(conceptId, concept);

				return conceptId;
			});

			customObjects.push({
				key,
				value: conceptIds,
			});
		}
		customMap.set(entryId, customObjects);
	}

	const { uniqueMap, pool } = distinctConcept(conceptMap);
	const customMapArray = Array.from(customMap);
	for (const [id, items] of customMapArray) {
		const newItems = [];
		for (const { key, value } of items) {
			const conceptIds = value.flatMap((conceptId) => {
				const result = uniqueMap.get(conceptId);
				return typeof result === "number" ? [pool[result].id] : [];
			});

			newItems.push({ key, value: conceptIds });
		}

		customMap.set(id, newItems);
	}

	return {
		pool,
		entrise: entryIds.map((entryId) => {
			const targetIds = targetMap.get(entryId);
			if (!targetIds) throw new Error("目標丟失");

			const attributes = attributesMap.get(entryId);
			const customAttributes = customMap.get(entryId);
			if (!attributes && !customAttributes) throw new Error("目標丟失");

			return {
				targetIds,
				...attributes,
				customAttributes,
			};
		}),
	};
}

function distinctConcept(conceptMap: Map<string, ConceptRegistry["single"]>) {
	const uniqueMap = new Map<string, number>();
	const hashMap = new Map<string, number>();
	const pool = [];

	for (const [key, currentObj] of conceptMap) {
		const hash = uuidv5(
			JSON.stringify(sortObjectKeys(currentObj)),
			ONTOLOGY_NAMESPACE,
		);

		const exsist = hashMap.get(hash);
		if (exsist) {
			const { id, ...obj } = pool[exsist];

			if (!_.isEqual(obj, currentObj)) {
				throw new Error("內容相同，但結構不同");
			}
			uniqueMap.set(key, exsist);
		} else {
			const newObj = { id: uuidv7(), ...currentObj };
			pool.push(newObj);
			hashMap.set(hash, pool.length - 1);
			uniqueMap.set(key, pool.length - 1);
		}
	}

	return { uniqueMap, pool };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortObjectKeys(obj: unknown): unknown {
	if (typeof obj === "string") {
		return obj.trim().toLowerCase();
	}

	if (Array.isArray(obj)) {
		return obj.map(sortObjectKeys);
	}

	// 使用 Type Guard，TypeScript 會自動將 obj 的型別收窄為 Record<string, unknown>
	if (isPlainObject(obj)) {
		return Object.keys(obj)
			.sort()
			.reduce((result: Record<string, unknown>, key: string) => {
				result[key] = sortObjectKeys(obj[key]); // 這裡可以直接用 obj[key]，完全不報錯
				return result;
			}, {});
	}

	// 剩下不是物件、不是陣列、不是字串的其他基本型別（如數字、布林值、null、undefined）
	return obj;
}

export function preProcessing(input: AttachAttributes["array"]) {
	return splitConcept(input);
}

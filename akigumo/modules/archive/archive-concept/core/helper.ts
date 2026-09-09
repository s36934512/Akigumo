import _ from "lodash";
import { v5 as uuidv5, v7 as uuidv7 } from "uuid";

import { ONTOLOGY_NAMESPACE } from "#akigumo/shared/contracts/index.js";

import type { ArchiveConcept } from "../api/schema.js";
import type {
	ConceptRegistryWithId,
	JustIdObject,
	KeyWithTempId,
	ValueWithTempId,
} from "./type.js";

// ==========================================
// 1. 補全與標準化階段 (Normalizer)
// ==========================================
function normalizeInput(input: ArchiveConcept["array"]) {
	return input.map((item) => ({
		targetIdList: item.targetIdList,
		metadataList:
			item.metadataList?.map((meta) => {
				// 標準化 key：如果有 name 且沒有 id，發給它一個隨機的 _tempId 準備去重

				const k = meta.key;
				let normalizedKey: JustIdObject | KeyWithTempId;

				if ("name" in k && !k.id) {
					normalizedKey = { _tempId: uuidv7(), name: k.name };
				} else if (k.id) {
					normalizedKey = { id: k.id };
				} else {
					throw new Error("無效的 Key 結構");
				}

				// 標準化 value：保留純 id 物件結構
				const normalizedValue = meta.value.map(
					(v): JustIdObject | ValueWithTempId => {
						if ("name" in v) {
							return { _tempId: uuidv7(), ...v };
						}
						if ("id" in v && v.id) {
							return { id: v.id }; // 👈 這裡！保留原有的 { id: string } 結構
						}
						throw new Error("無效的 Value 結構");
					},
				);

				return { key: normalizedKey, value: normalizedValue };
			}) ?? [],
	}));
}

// ==========================================
// 2. 去重與建立索引階段 (Registry / Indexer)
// ==========================================
type NormalizedInput = ReturnType<typeof normalizeInput>;

function extractAndDistinctConcepts(normalizedInput: NormalizedInput) {
	const pool: ConceptRegistryWithId[] = [];
	const hashMap = new Map<string, string>(); // hash -> 正式 uuidv7
	const idReplaceMap = new Map<string, string>(); // _tempId -> 正式 uuidv7

	// 輔助函式：將單一物件進行去重與推入 pool
	const processConcept = (v: KeyWithTempId | ValueWithTempId) => {
		// 移除臨時的 _tempId 後計算雜湊
		const conceptDataWithoutId = _.omit(v, ["_tempId"]);
		const hash = uuidv5(
			JSON.stringify(sortObjectKeys(conceptDataWithoutId)),
			ONTOLOGY_NAMESPACE,
		);

		const existingOfficialId = hashMap.get(hash);
		if (existingOfficialId) {
			const matched = pool.find((p) => p.id === existingOfficialId);
			if (
				matched &&
				!_.isEqual(_.omit(matched, ["id"]), conceptDataWithoutId)
			) {
				throw new Error("內容相同，但結構不同");
			}
			idReplaceMap.set(v._tempId, existingOfficialId);
		} else {
			const officialId = uuidv7();

			// 統一轉為 ConceptRegistry 物件存入 pool (key 沒有的欄位 Prisma 會是 null/undefined)
			pool.push({
				id: officialId,
				...conceptDataWithoutId,
			} as ConceptRegistryWithId);

			hashMap.set(hash, officialId);
			idReplaceMap.set(v._tempId, officialId);
		}
	};

	// 遍歷時，利用 TypeScript 的 'id' in 檢查，跳過只有 id 的純物件
	for (const item of normalizedInput) {
		for (const meta of item.metadataList) {
			if (!("id" in meta.key)) {
				processConcept(meta.key);
			}
			for (const v of meta.value) {
				if (!("id" in v)) processConcept(v); // 👈 同上
			}
		}
	}

	return { pool, idReplaceMap };
}

// ==========================================
// 3. 最終組裝階段 (Assembler)
// ==========================================
function assembleOutput(
	normalizedInput: NormalizedInput,
	pool: ConceptRegistryWithId[],
	idReplaceMap: Map<string, string>,
) {
	const entryList = normalizedInput.map((item) => {
		const metadataList = item.metadataList.map((meta) => {
			// 還原 key 的正式 id 陣列
			let keyId: string;
			if ("id" in meta.key) {
				keyId = meta.key.id;
			} else {
				const officialId = idReplaceMap.get(meta.key._tempId);
				if (!officialId) throw new Error("遺失對應的正式 ID (Key)");
				keyId = officialId;
			}

			// 還原 value 的正式 id 陣列
			const valueIds = meta.value.map((v) => {
				if ("id" in v) return v.id; // 👈 如果是原本保留下來的純 id 物件，直接取用 id

				const officialId = idReplaceMap.get(v._tempId);
				if (!officialId) throw new Error("遺失對應的正式 ID (Value)");
				return officialId;
			});

			return {
				key: keyId, // 這裡現在也是純正式 id 的字串陣列
				value: valueIds,
			};
		});

		return {
			targetIdList: item.targetIdList,
			metadataList,
		};
	});

	return { pool, entryList };
}

// ==========================================
// 主流程進入點 (Pipeline Entry)
// ==========================================
export function preProcessing(input: ArchiveConcept["array"]) {
	// 第一步：乾淨的資料標準化（補齊 key id 與將 value 結構一致化）
	const normalized = normalizeInput(input);

	// 第二步：收集、去重並產出正式的知識庫 Pool 與 ID 映射表
	const { pool, idReplaceMap } = extractAndDistinctConcepts(normalized);

	// 第三步：依據映射表快速拍平輸出
	return assembleOutput(normalized, pool, idReplaceMap);
}

// ==========================================
// 工具函式 (Helper Functions)
// ==========================================
function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortObjectKeys(obj: unknown): unknown {
	if (typeof obj === "string") return obj.trim().toLowerCase();
	if (Array.isArray(obj)) return obj.map(sortObjectKeys);
	if (isPlainObject(obj)) {
		return Object.keys(obj)
			.sort()
			.reduce((result: Record<string, unknown>, key: string) => {
				result[key] = sortObjectKeys(obj[key]);
				return result;
			}, {});
	}
	return obj;
}

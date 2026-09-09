import { computed, DestroyRef, inject, Service } from "@angular/core";
import { injectQuery, QueryClient } from "@tanstack/angular-query-experimental";
import Fuse from "fuse.js";
import { produce } from "immer";
import { v7 as uuidv7 } from "uuid";
import { environment } from "@/environments/environment";
import { DefaultService } from "@/shared/api/default/default.service";
import type {
	PostApiV1OntologyResolver200NodesItemData,
	PostApiV1OntologyResolver202,
} from "@/shared/api/model";
import {
	commitSsePatchQueue,
	registerSsePatchQueue,
} from "@/shared/lib/sse-patch-store";
import { SseBrokerService } from "@/shared/services/sse-broker.service";
import { fuseConfig } from "./config";
import { PatchOperate, type PatchPayload, PatchPayloadSchema } from "./sse";

function mergePatchIntoMap(
	patchMap: Map<string, PatchPayload["single"]>,
	sseItem: PatchPayload["single"],
): void {
	const entryId = sseItem.entry.id;
	const existing = patchMap.get(entryId);

	if (!existing) {
		patchMap.set(entryId, { ...sseItem });
		return;
	}

	existing.seq = sseItem.seq; // 維持最新號碼牌

	switch (sseItem.op) {
		case PatchOperate.DELETE_OBJ:
			existing.op = PatchOperate.DELETE_OBJ;
			existing.entry = { id: entryId };
			break;
	}
}

function applyPatchesToSnapshot(
	baseItems: PostApiV1OntologyResolver202,
	patchMap: Map<string, PatchPayload["single"]>,
): PostApiV1OntologyResolver202 {
	if (baseItems.nodes.length === 0) return { nodes: [], edges: [] };

	return produce(baseItems, (draft) => {
		// 逆向迴圈安全處理陣列刪除
		for (let i = draft.nodes.length - 1; i >= 0; i--) {
			const item = draft.nodes[i];

			const finalPatch = patchMap.get(item.data.id);

			if (finalPatch) {
				if (finalPatch.seq > 0) {
					switch (finalPatch.op) {
						case PatchOperate.DELETE_OBJ:
							draft.nodes.splice(i, 1);
							break;
					}
				}
				patchMap.delete(item.data.id);
			}
		}
	});
}

@Service()
export class ConceptEntryStore {
	private readonly defaultService = inject(DefaultService);
	private readonly queryClient = inject(QueryClient);
	private readonly sseBrokerService = inject(SseBrokerService);
	private readonly destroyRef = inject(DestroyRef);

	readonly notifyId = uuidv7();

	private query = injectQuery(() => ({
		queryKey: ["concept-snapshot"],
		queryFn: () =>
			this.defaultService.postApiV1OntologyResolver({
				operate: "ALL",
				notifyId: this.notifyId,
				showDeleted: false,
			}),
	}));

	private patchesQuery = injectQuery(() => ({
		queryKey: ["concept-patches"],
		queryFn: () => [] as PatchPayload["array"],
		staleTime: Infinity,
		gcTime: Infinity,
	}));

	readonly cyElement = computed(() => {
		if (!this.query.isSuccess()) return { nodes: [], edges: [] };
		const accumulatedPatches = this.patchesQuery.data() ?? [];

		if (accumulatedPatches.length > 0) {
			console.log(accumulatedPatches);
			queueMicrotask(() => this.flushPatchQueue());
		}

		console.dir(this.query.data());

		return this.query.data();
	});

	readonly nodes = computed(() => {
		const cyElement = this.cyElement();
		return cyElement.nodes.map((node) => node.data);
	});

	readonly edges = computed(() => {
		const cyElement = this.cyElement();
		return cyElement.edges.map((edge) => edge.data);
	});

	readonly nodeMap = computed(() => {
		return new Map(this.nodes().map((concept) => [concept.id, concept]));
	});

	readonly edgeMap = computed(() => {
		return new Map(this.edges().map((edge) => [edge.id, edge]));
	});

	readonly fuse = computed(() => {
		return new Fuse<PostApiV1OntologyResolver200NodesItemData>(
			this.nodes(),
			fuseConfig,
		);
	});

	constructor() {
		const url = `${environment.apiUrl}/api/v1/stream`;

		const unregister = registerSsePatchQueue(
			this.sseBrokerService,
			url,
			"CONCEPT_PATCH",
			this.queryClient,
			["concept-patches"],
			PatchPayloadSchema.single,
		);

		this.destroyRef.onDestroy(() => {
			unregister();
		});

		this.sseBrokerService.listen(url);
	}

	private flushPatchQueue() {
		const patchesToCommit = commitSsePatchQueue<
			PostApiV1OntologyResolver202,
			PatchPayload["single"]
		>({
			queryClient: this.queryClient,
			patchQueryKey: ["concept-patches"],
			snapshotQueryKey: ["concept-snapshot"],
			mergePatchIntoMap,
			applyPatchesToSnapshot,
		});

		if (patchesToCommit.length > 0) {
			console.log(
				`[SSE 防禦系統] 已成功 Commit ${patchesToCommit.length} 筆，並安全更新佇列。`,
			);
		}
	}
}

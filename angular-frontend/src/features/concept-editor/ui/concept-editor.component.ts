import {
	afterRenderEffect,
	Component,
	computed,
	ElementRef,
	inject,
	signal,
} from "@angular/core";
import { debounce, FormField, form, required } from "@angular/forms/signals";
import {
	NgLabelTemplateDirective,
	NgOptionTemplateDirective,
	NgSelectComponent,
} from "@ng-select/ng-select";
import Tagify, { type TagifySettings } from "@yaireo/tagify";
import { ConceptEntryStore, TagComponent } from "@/entities/concept";
import type { PostApiV1OntologyResolver200NodesItemData } from "@/shared/api/model";
import { ConceptEditorStore } from "../model/concept-editor.store";
@Component({
	selector: "feature-concept-editor",
	standalone: true,
	imports: [
		TagComponent,
		FormField,
		NgLabelTemplateDirective,
		NgOptionTemplateDirective,
		NgSelectComponent,
	],
	templateUrl: "./concept-editor.component.html",
	providers: [ConceptEditorStore],
})
export class ConceptEditorComponent {
	protected readonly conceptEntryStore = inject(ConceptEntryStore);
	private readonly conceptEditorStore = inject(ConceptEditorStore);
	private tagifyInstance?: Tagify;
	private el = inject(ElementRef);

	searchModel = signal({ selectedId: [] as string[] });
	searchForm = form(this.searchModel, (schemaPath) => {
		// 直接針對該欄位的變化設定防抖時間 (例如 500 毫秒)
		debounce(schemaPath.selectedId, 500);
		required(schemaPath.selectedId);
	});

	tagifySettings = computed<TagifySettings>(() => {
		const concepts = this.conceptEntryStore.nodes() ?? [];
		const whitelist = concepts.flatMap((item) => {
			if (item) {
				return [{ value: item.name, id: item.id }];
			}
			return [];
		});

		return {
			whitelist,
			enforceWhitelist: false,
			autoComplete: {
				enabled: false,
			},
			dropdown: {
				enabled: 0,
				searchKeys: [], // 設為空陣列，關閉 Tagify 內建的欄位比對
				fuzzySearch: false, // 關閉 Tagify 內建的模糊搜尋，改用自己的 Fuse.js
				closeOnSelect: true,
				highlightFirst: false,
				mapValueTo: "",
			},
		};
	});

	isStoreLoaded = computed(() => {
		const items = this.conceptEntryStore.nodes();
		return Array.isArray(items); // 確保不是 undefined 且已就緒
	});

	addTempTag = (term: string) => {
		// 建立一個臨時的物件，將 id 直接設為輸入的文字（或任何您方便處理的值）
		const tempTag = {
			id: `!newTag-${term || ""}`, // 使用前綴避免與現有 id 衝突
			name: term,
		};

		// ⚠️ 關鍵：絕對不要執行 this.cities.push(tempTag)！
		// 這樣它就永遠不會出現在下拉選單的選項清單中。

		return tempTag; // 直接回傳，讓輸入框顯示並選取該項目
	};

	customSearchFn = (
		term: string,
		item: PostApiV1OntologyResolver200NodesItemData,
	): boolean => {
		// 如果使用者沒有輸入任何字，預設顯示所有選項
		if (!term || term.trim() === "") {
			return true;
		}

		// 使用 Fuse.js 進行模糊搜尋
		const searchResults = this.conceptEntryStore.fuse().search(term);

		// 檢查目前這個選項 (item) 是否存在於 Fuse 的搜尋結果中
		return searchResults.some((result) => result.item.id === item.id);
	};

	constructor() {
		afterRenderEffect(() => {
			const currentSettings = this.tagifySettings();

			if (!this.tagifyInstance) {
				// 1. 第一次載入：直接傳入初始設定
				const rawInput = this.el.nativeElement.querySelector(
					"#tagify-input",
				) as HTMLInputElement;

				// 確保有撈到元素，才初始化 Tagify
				if (rawInput) {
					this.tagifyInstance = new Tagify(rawInput, currentSettings);

					this.tagifyInstance.on("input", (e) => {
						const tagify = e.detail.tagify;
						const value =
							tagify.DOM.input.textContent?.trim() ?? "";
						console.log("Tagify 輸入事件觸發，當前輸入值：", value);
						if (value.length > 0) {
							// 利用 Fuse.js 進行模糊搜尋
							const searchResults = this.conceptEntryStore
								.fuse()
								.search(value);
							// Fuse 回傳的格式為 [{ item: {...}, refIndex: ... }], 需要取出 item
							const matches = searchResults.map(
								(result) => result.item,
							);
							console.log("模糊搜尋結果：", matches);

							// 將模糊搜尋結果動態更新給 Tagify 的下拉清單並顯示
							tagify.settings.whitelist = matches.flatMap(
								(item) => {
									if (item) {
										return [
											{ value: item.name, id: item.id },
										];
									}
									return [];
								},
							);
							tagify.dropdown.show(value);
						} else {
							tagify.dropdown.hide();
						}
					});
				}
			} else {
				// 2. 後續更新：只針對特定的白名單與防護設定做安全更新，避開 templates 覆蓋引起的型別錯誤
				if (currentSettings.whitelist) {
					this.tagifyInstance.whitelist = currentSettings.whitelist;
				}

				// 如果有其他基礎屬性需要連動更新，直接精確指定到物件屬性上：
				if (currentSettings.enforceWhitelist !== undefined) {
					this.tagifyInstance.settings.enforceWhitelist =
						currentSettings.enforceWhitelist;
				}

				// ✅ 如果真的必須一口氣合併其他自訂設定，使用型別斷言 (Type Assertion) 告訴 TS 這是安全的：
				// Object.assign(this.tagifyInstance.settings, currentSettings as any);
			}
		});
	}

	ngOnDestroy() {
		if (this.tagifyInstance) {
			try {
				this.tagifyInstance.destroy();
			} catch (error) {
				// 安全攔截，防範任何未定義錯誤
				console.warn("Tagify Directive 銷毀時安全攔截：", error);
			}
			this.tagifyInstance = undefined;
		}
	}

	onCancel() {
		this.searchModel.set({
			selectedId: [],
		});
	}

	onSubmit() {
		console.log("當前確定的標籤值：", this.searchForm.selectedId().value());

		const itemString = this.searchForm.selectedId().value();

		const itemList = itemString
			.filter((item) => item.startsWith("!newTag-"))
			.map((item) => {
				const name = item.replace("!newTag-", "");
				return name;
			});

		console.log("要送出的標籤列表：", itemList);

		this.conceptEditorStore.attach([
			{
				key: "test",
				value: itemList.map((item) => ({ name: item })),
			},
		]);
	}
}

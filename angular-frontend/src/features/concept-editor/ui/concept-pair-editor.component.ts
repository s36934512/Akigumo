import { Component, inject, signal } from "@angular/core";
import { debounce, FormField, form, required } from "@angular/forms/signals";
import {
	NgLabelTemplateDirective,
	NgOptionTemplateDirective,
	NgSelectComponent,
} from "@ng-select/ng-select";
import { ConceptEntryStore, TagComponent } from "@/entities/concept";
import { ConceptInputComponent } from "@/features/concept-input/ui/concept-input.component";
import type { PostApiV1OntologyResolver200NodesItemData } from "@/shared/api/model";
import { ConceptEditorStore } from "../model/concept-editor.store";
import { ConceptTagifyDirective } from "../model/tagify-fuse.directive";

@Component({
	selector: "feature-concept-pair-editor",
	standalone: true,
	imports: [
		TagComponent,
		ConceptTagifyDirective,
		FormField,
		NgLabelTemplateDirective,
		NgOptionTemplateDirective,
		NgSelectComponent,
		ConceptInputComponent,
	],
	templateUrl: "./concept-pair-editor.component.html",
	providers: [ConceptEditorStore],
})
export class ConceptPairEditorComponent {
	protected readonly conceptEntryStore = inject(ConceptEntryStore);

	searchModel = signal({
		selectedIdA: [] as string[],
		selectedIdB: [] as string[],
	});

	searchForm = form(this.searchModel, (schemaPath) => {
		debounce(schemaPath.selectedIdA, 500);
		required(schemaPath.selectedIdA);
		debounce(schemaPath.selectedIdB, 500);
		required(schemaPath.selectedIdB);
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
}

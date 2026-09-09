import { Component, inject, input } from "@angular/core";
import { type Field, FormField } from "@angular/forms/signals";
import {
	NgLabelTemplateDirective,
	NgOptionTemplateDirective,
	NgSelectComponent,
} from "@ng-select/ng-select";

import { ConceptEntryStore } from "@/entities/concept";
import type { PostApiV1OntologyResolver200NodesItemData } from "@/shared/api/model";

@Component({
	selector: "feature-concept-input",
	standalone: true,
	imports: [
		FormField,
		NgLabelTemplateDirective,
		NgOptionTemplateDirective,
		NgSelectComponent,
	],
	templateUrl: "./concept-input.component.html",
})
export class ConceptInputComponent {
	protected readonly conceptEntryStore = inject(ConceptEntryStore);

	formField = input.required<Field<unknown, string | number>>();
	multiple = input(false);

	addTempTag = (term: string) => {
		const tempTag = {
			id: `newTag-${term || ""}`,
			name: term,
		};

		// 絕對不要執行 this.cities.push(tempTag)！
		// 這樣它就永遠不會出現在下拉選單的選項清單中。

		return tempTag; // 直接回傳，讓輸入框顯示並選取該項目
	};

	customSearchFn = (
		term: string,
		item: PostApiV1OntologyResolver200NodesItemData,
	): boolean => {
		if (!term || term.trim() === "") {
			return true;
		}

		const searchResults = this.conceptEntryStore.fuse().search(term);

		// 檢查目前這個選項 (item) 是否存在於 Fuse 的搜尋結果中
		return searchResults.some((result) => result.item.id === item.id);
	};
}

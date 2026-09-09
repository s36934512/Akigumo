import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { FormField } from "@angular/forms/signals";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { type FormlyFieldConfig, FormlyForm } from "@ngx-formly/core";
import { TagComponent } from "@/entities/concept";
import { ConceptPairEditorComponent } from "@/features/concept-editor/ui/concept-pair-editor.component";
import { ConceptSearchStore } from "@/features/concept-search";
import { SearchComponent } from "@/features/search";
import { InfoAddComponent } from "@/widgets/info-add";

interface SearchModel {
	keyword: string;
}

@Component({
	selector: "page-t",
	standalone: true,
	imports: [CommonModule, InfoAddComponent],
	templateUrl: "./t.html",
	providers: [ConceptSearchStore],
})
export class TPage {
	conceptSearchStore = inject(ConceptSearchStore);

	// form = new FormGroup({});

	// model = signal<SearchModel>({ keyword: "" });

	// fields: FormlyFieldConfig[] = [
	// 	{
	// 		key: "keyword",
	// 		type: "input",
	// 		props: {
	// 			label: "標籤名稱",
	// 			placeholder: "請輸入名稱",
	// 			required: true,
	// 		},
	// 	},
	// ];

	// existConcept = this.conceptSearchStore.filteredData;

	// onModelChange(newModel: SearchModel) {
	// 	// 使用解構賦值產生新物件，確保 Signal 偵測到變更
	// 	this.model.set({ ...newModel });

	// 	// 如果您的 Store 需要手動觸發搜尋，可以在這裡呼叫：
	// 	this.conceptSearchStore.search(newModel.keyword);
	// }
}

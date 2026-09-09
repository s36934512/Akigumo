import { Component, computed, inject, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { debounce, FormField, form, required } from "@angular/forms/signals";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
	DynamicForm,
	type FormConfig,
	type InferFormValue,
} from "@ng-forge/dynamic-forms";
import { ConceptEntryStore, TagComponent } from "@/entities/concept";
import { DefaultService } from "@/shared/api/default/default.service";
import type { PostApiV1OntologyRegistryBodyItem } from "@/shared/api/model";
import { DeleteModeDirective } from "@/shared/lib/delete-mode";

@Component({
	selector: "feature-concept-registry",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		FormField,
		TagComponent,
		DynamicForm,
		MatButtonModule,
		DeleteModeDirective,
	],
	templateUrl: "./concept-registry.component.html",
})
export class ConceptRegistryComponent {
	private readonly defaultService = inject(DefaultService);
	private readonly conceptEntryStore = inject(ConceptEntryStore);

	model = signal<PostApiV1OntologyRegistryBodyItem>({
		name: "",
		description: undefined,
		metadata: undefined,
	});

	formConfig = {
		defaultValidationMessages: {
			required: "此欄位為必填項目。",
		},
		fields: [
			{
				key: "name",
				type: "input",
				label: "標籤名稱",
				placeholder: "請輸入名稱",
				required: true, // 啟用必填
			},
			{
				key: "description",
				type: "input",
				label: "標籤描述",
				placeholder: "請輸入描述",
			},
			// {
			// 	key: "metadata",
			// 	type: "input",
			// 	label: "其他",
			// 	placeholder: "請輸入JSON",
			// },
			{ key: "submitButton", type: "submit", label: "送出" },
		],
	} as const satisfies FormConfig;

	// 3. ✨ 計算屬性：當 ng-forge 更新 model() 時，此處會自動同步觸發比對
	// existConcept = computed(() => {
	// 	const nameMap = this.conceptEntryStore.nameMap();
	// 	const currentData = this.model();

	// 	return nameMap.get(currentData.name) ?? [];
	// });

	// 4. 重置表單方法
	onCancel() {
		this.model.set({
			name: "",
			description: undefined,
			metadata: undefined,
		});
	}

	// 5. ✨ 表單提交事件（由 HTML 傳入當前的表單值）
	onSubmit(value: InferFormValue<typeof this.formConfig>) {
		console.dir(value);
		// 呼叫 API 送出資料
		this.defaultService.postApiV1OntologyRegistry({
			notifyId: this.conceptEntryStore.notifyId,
			registryList: [value],
		});
	}
}

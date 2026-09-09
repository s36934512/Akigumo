import { Component, computed, inject, signal } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { debounce, FormField, form, required } from "@angular/forms/signals";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { type FormlyFieldConfig, FormlyForm } from "@ngx-formly/core";

import { ConceptEntryStore, TagComponent } from "@/entities/concept";
import { DefaultService } from "@/shared/api/default/default.service";
import type { PostApiV1OntologyRegistryBodyItem } from "@/shared/api/model";

@Component({
	selector: "feature-concept-registry-form",
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		FormField,
		TagComponent,
		FormlyForm,
	],
	templateUrl: "./form.component.html",
})
export class FormComponent {
	private readonly defaultService = inject(DefaultService);
	private readonly conceptEntryStore = inject(ConceptEntryStore);

	form = new FormGroup({});

	model = signal({ name: "", description: undefined, metadata: undefined });

	fields: FormlyFieldConfig[] = [
		{
			key: "name",
			type: "input",
			props: {
				label: "標籤名稱",
				placeholder: "請輸入名稱",
				required: true,
				change: (field) => this.updateModel(),
			},
		},
		{
			key: "description",
			type: "input",
			props: {
				label: "標籤描述",
				placeholder: "請輸入描述",
				change: (field) => this.updateModel(),
			},
		},
		{
			key: "metadata",
			type: "input",
			props: {
				label: "其他",
				placeholder: "請輸入JSON",
				change: (field) => this.updateModel(),
			},
		},
	];

	conceptModel = signal<PostApiV1OntologyRegistryBodyItem>({ name: "" });
	conceptForm = form(this.conceptModel, (schemaPath) => {
		// 直接針對該欄位的變化設定防抖時間 (例如 500 毫秒)
		debounce(schemaPath, 500);
		required(schemaPath);
	});

	existConcept = computed(() => {
		const items = this.conceptEntryStore.nodes();
		const currentData = this.model();

		return items.flatMap((item) => {
			return item.name === currentData.name ? [item] : [];
		});
	});

	private updateModel() {
		// 取得當前表單對象，並解構賦值給 signal 觸發 computed
		this.model.set({ ...(this.form.value as any) });
	}

	onCancel() {
		this.conceptModel.set({
			name: "",
		});
	}

	onSubmit() {
		if (this.form.valid) {
			console.dir(this.model);
			this.defaultService.postApiV1OntologyRegistry({
				notifyId: this.conceptEntryStore.notifyId,
				registryList: [this.model],
			});
		}
	}
}

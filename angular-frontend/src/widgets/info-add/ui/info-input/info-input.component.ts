import {
	Component,
	DestroyRef,
	effect,
	inject,
	input,
	output,
	signal,
} from "@angular/core";
import {
	debounce,
	FormField,
	form,
	minLength,
	required,
} from "@angular/forms/signals";
import { ConceptInputComponent } from "@/features/concept-input";
import { InfoItemStore } from "../../model";

@Component({
	selector: "widget-info-panel-info-input",
	standalone: true,
	imports: [ConceptInputComponent, FormField],
	templateUrl: "./info-input.component.html",
})
export class InfoInputComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly infoItemStore = inject(InfoItemStore);

	id = input.required<string>();

	infoModel = signal({
		keyId: "" as string,
		valueId: [] as string[],
	});

	infoForm = form(this.infoModel, (schemaPath) => {
		debounce(schemaPath.keyId, 500);
		required(schemaPath.keyId);
		debounce(schemaPath.valueId, 500);
		required(schemaPath.valueId);
		minLength(schemaPath.valueId, 1);
	});

	onClose = output<void>();

	constructor() {
		// 使用 effect 來建立響應式同步鏈
		effect(() => {
			// 1. 取得當前 id (隨時適應 id 改變，雖然一般動態元件 id 是固定的)
			const currentId = this.id();
			// 2. 讀取 infoModel() 的最新狀態 (當 Signal Forms 更新它時，這裡會自動重新執行)
			const currentModel = this.infoModel();

			// 3. 即時同步到父級/全域的 Store
			this.infoItemStore.updateValue(currentId, currentModel);
		});

		this.destroyRef.onDestroy(() => {
			this.infoItemStore.unregister(this.id());
		});
	}
}

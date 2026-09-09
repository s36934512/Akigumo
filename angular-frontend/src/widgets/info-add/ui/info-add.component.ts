import {
	Component,
	type ComponentRef,
	inject,
	ViewChild,
	ViewContainerRef,
} from "@angular/core";
import { InfoItemStore } from "../model";
import { InfoInputComponent } from "./info-input";

@Component({
	selector: "widget-info-add",
	standalone: true,
	imports: [InfoInputComponent],
	templateUrl: "./info-add.component.html",
	providers: [InfoItemStore],
})
export class InfoAddComponent {
	private readonly infoItemStore = inject(InfoItemStore);

	@ViewChild("container", { read: ViewContainerRef, static: true })
	container!: ViewContainerRef;

	private componentRefs = new Map<string, ComponentRef<InfoInputComponent>>();
	private uniqueIdCounter = 0;

	allData = this.infoItemStore.allData;

	loadComponent() {
		const uniqueId = `input_${++this.uniqueIdCounter}`;
		// 1. 清除舊有內容（選用，避免重複疊加）
		// this.container.clear();

		// 2. 直接建立並注入元件
		const componentRef = this.container.createComponent(InfoInputComponent);

		componentRef.setInput("id", uniqueId);
		this.componentRefs.set(uniqueId, componentRef);

		// 3. 傳遞資料到元件的 @Input (若有)
		// this.componentRef.instance.someInputData = "哈囉，這是傳入的資料";

		// 4. 監聽元件的 @Output 事件 (若有)
		// this.componentRef.instance.someOutputEvent.subscribe((data) => {
		// 	console.log("接收到動態元件傳回的資料：", data);
		// });

		componentRef.instance.onClose.subscribe(() => {
			this.removeComponent(uniqueId);
		});
	}

	removeComponent(id: string) {
		const componentRef = this.componentRefs.get(id);

		if (componentRef) {
			// 1. 從 Angular 視圖容器中將該元件銷毀並自 DOM 移除
			componentRef.destroy();

			// 2. 從對照表中釋放記憶體
			this.componentRefs.delete(id);
		}
	}
}

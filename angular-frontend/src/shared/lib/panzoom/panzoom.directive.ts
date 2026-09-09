import {
	afterNextRender,
	DestroyRef,
	Directive,
	ElementRef,
	inject,
	input,
	output,
} from "@angular/core";
import {
	Panzoom,
	type PanzoomInstance,
	type PanzoomOptions,
} from "@fancyapps/ui/dist/panzoom";

@Directive({
	selector: "[panzoomDirective]",
	standalone: true,
})
export class PanzoomDirective {
	private readonly el = inject(ElementRef);
	private readonly destroyRef = inject(DestroyRef);

	private panzoomInstance?: PanzoomInstance;

	options = input<Partial<PanzoomOptions>>({});

	panzoomChange = output<PanzoomInstance>();

	constructor() {
		// 確保只在瀏覽器端 DOM 渲染完成後執行
		afterNextRender(() => {
			const container = this.el.nativeElement as HTMLElement;
			this.panzoomInstance = Panzoom(container, {
				// maxScale: 5,
				// minScale: 0.5,
				// ...this.options(),
			}).init();

			this.panzoomInstance.on("*", (instance: PanzoomInstance) => {
				this.panzoomChange.emit(instance);
			});
		});

		// 元件銷毀時釋放記憶體
		this.destroyRef.onDestroy(() => {
			this.panzoomInstance?.destroy();
		});
	}
}

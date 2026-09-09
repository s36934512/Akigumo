import { Location } from "@angular/common";
import {
	afterNextRender,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	effect,
	Injector,
	inject,
	input,
	runInInjectionContext,
	ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { Panzoom, type PanzoomInstance } from "@fancyapps/ui/dist/panzoom/";
import { ArchiveEntryStore } from "@/entities/archive";
import { ConceptEntryStore } from "@/entities/concept";
import { ConceptEditorComponent } from "@/features/concept-editor";
import { PanzoomDirective } from "@/shared/lib/panzoom/index";
import { ControllerComponent } from "./controller";

@Component({
	selector: "widget-archive-detail",
	standalone: true,
	imports: [
		FormsModule,
		RouterModule,
		ConceptEditorComponent,
		PanzoomDirective,
		ControllerComponent,
	],
	templateUrl: "./archive-detail.component.html",
	styleUrl: "./archive-detail.component.scss",
})
export class ArchiveDetailComponent {
	private readonly location = inject(Location);
	private readonly archiveEntryStore = inject(ArchiveEntryStore);
	private readonly conceptEntryStore = inject(ConceptEntryStore);

	id = input.required<string>();

	entry = computed(() => {
		const entries = this.archiveEntryStore.visibleEntries();
		return entries?.find((item) => item.id === this.id());
	});

	concepts = computed(() => {
		const entry = this.entry();
		const conceptItemsMap = this.conceptEntryStore.nodeMap();

		return entry?.conceptList?.flatMap((item) => {
			if (item.conceptId) {
				return conceptItemsMap.get(item.conceptId) ?? [];
			}
			return [];
		});
	});

	get coverUrl(): string | null {
		const entry = this.entry();
		if (entry && "file" in entry) {
			return entry.file.url ?? null;
		}
		return null;
	}

	get computedOptions() {
		return {
			minScale: 0.2,
		};
	}
	private readonly el = inject(ElementRef);
	private readonly destroyRef = inject(DestroyRef);
	private panzoomInstance?: PanzoomInstance;
	private readonly injector = inject(Injector);
	constructor() {
		effect(() => {
			const url = this.coverUrl; // 追蹤計算屬性的 URL 變化
			const currentEntry = this.entry();

			// 當資料確實到位時
			if (currentEntry && url) {
				// 2. 利用 runInInjectionContext 重新建立環境，安全呼叫生命週期
				runInInjectionContext(this.injector, () => {
					// 3. 呼叫 afterNextRender 確保此時 DOM 已經跟資料同步
					afterNextRender(() => {
						const host = this.el.nativeElement as HTMLElement;
						// 精準抓取裝圖片的容器
						const container = host.querySelector(
							".f-panzoom",
						) as HTMLElement;

						if (!container) {
							console.log("❌ 找不到 .f-panzoom 容器");
							return;
						}

						// 4. 重整時保險起見：若已有舊實例先銷毀
						if (this.panzoomInstance) {
							this.panzoomInstance.destroy();
						}

						// 5. 給瀏覽器最後一個 microtask 的時間，100% 初始化並印出日誌
						setTimeout(() => {
							this.panzoomInstance = Panzoom(container, {
								// minScale: 0.2
							}).init();
							this.panzoomInstance.on(
								"render",
								(panzoomInstance) => {
									this.updateMinimap(panzoomInstance);
								},
							);
							setTimeout(
								() => this.updateMinimap(this.panzoomInstance),
								300,
							);
							console.log(
								"🔥 不管是重整還是外部進入，Panzoom 都成功初始化了！",
								this.panzoomInstance,
							);
						}, 50);
					});
				});
			}
		});

		// 元件銷毀時釋放記憶體
		this.destroyRef.onDestroy(() => {
			this.panzoomInstance?.destroy();
		});
	}

	goBack() {
		this.location.back();
	}

	@ViewChild("minimapContainer")
	minimapContainer!: ElementRef<HTMLDivElement>;
	@ViewChild("minimapBox") minimapBox!: ElementRef<HTMLDivElement>;
	updateMinimap(panzoom: PanzoomInstance | undefined) {
		if (!panzoom) return;
		if (!this.minimapBox || !this.minimapContainer) return;

		// 1. 取得當前變形數據 (Scale, X, Y)
		const { scale, x, y } = panzoom.getTransform();

		// 2. 獲取小地圖容器的實際像素尺寸
		const miniWidth = this.minimapContainer.nativeElement.clientWidth;
		const miniHeight = this.minimapContainer.nativeElement.clientHeight;

		// 3. 計算定位紅框的寬高比例（直接由 scale 決定縮小比例）
		let boxWidth = miniWidth / scale;
		let boxHeight = miniHeight / scale;

		// 限制紅框最大不超過小地圖範圍（即 100% 未放大狀態）
		boxWidth = Math.min(boxWidth, miniWidth);
		boxHeight = Math.min(boxHeight, miniHeight);

		// 4. 獲取 Panzoom 當前容許的移動邊界 (Bounds)
		// Panzoom 內部會根據圖片大小與可視範圍計算出 x 和 y 的 min/max
		const bounds = panzoom.getBoundaries();

		let boxLeft = 0;
		let boxTop = 0;

		if (bounds) {
			const minX = bounds.x[0];
			const maxX = bounds.x[1];
			const minY = bounds.y[0];
			const maxY = bounds.y[1];

			// 計算當前 x, y 在可移動區間中的相對比例 (0 ~ 1)
			// 公式：(當前值 - 最小值) / (最大值 - 最小值)
			// 因為大圖往右移動時小框也要往右，所以需要用 1 減去該比例來反轉方向
			const percentX = maxX !== minX ? 1 - (x - minX) / (maxX - minX) : 0;
			const percentY = maxY !== minY ? 1 - (y - minY) / (maxY - minY) : 0;

			// 換算成小地圖上的實際 Left / Top 像素距離
			boxLeft = percentX * (miniWidth - boxWidth);
			boxTop = percentY * (miniHeight - boxHeight);
		}

		// 5. 將計算結果直接渲染至小地圖紅框的 DOM
		const boxStyle = this.minimapBox.nativeElement.style;
		boxStyle.width = `${boxWidth}px`;
		boxStyle.height = `${boxHeight}px`;

		// 加上安全邊界限制，防止微小的浮點數誤差導致紅框飄出小地圖
		boxStyle.left = `${Math.max(0, Math.min(boxLeft, miniWidth - boxWidth))}px`;
		boxStyle.top = `${Math.max(0, Math.min(boxTop, miniHeight - boxHeight))}px`;
	}
}

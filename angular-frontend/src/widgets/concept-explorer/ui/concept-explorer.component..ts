import {
	afterRenderEffect,
	Component,
	DestroyRef,
	type ElementRef,
	inject,
	ViewChild,
} from "@angular/core";
import { ButtonModule } from "@openng/optimus-ui/button";
import { ButtonGroupModule } from "@openng/optimus-ui/buttongroup";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";

import { ConceptSelectionStore } from "@/features/concept-selection";

import { ToolComponent } from "./tool";
import { ZoomButtonComponent } from "./zoom-button";

cytoscape.use(cola);

@Component({
	selector: "widget-concept-explorer",
	standalone: true,
	imports: [
		ButtonModule,
		ButtonGroupModule,
		ToolComponent,
		ZoomButtonComponent,
	],
	templateUrl: "./concept-explorer.component.html",
	providers: [ConceptSelectionStore],
})
export class ConceptExplorerComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly conceptSelectionStore = inject(ConceptSelectionStore);

	@ViewChild("cyCanvas", { static: true }) cyCanvas!: ElementRef;

	private cy!: cytoscape.Core;
	private zoomStep = 0.2; // 每次縮放的比例比例

	constructor() {
		afterRenderEffect(() => {
			this.initCytoscape();
		});

		this.destroyRef.onDestroy(() => {
			if (this.cy) {
				this.cy.destroy();
			}
		});
	}

	private initCytoscape() {
		// 1. 定義初始資料：通常是一個核心起點（如：主硬碟、或核心節點）
		const initialElements: cytoscape.ElementsDefinition =
			this.conceptSelectionStore.store.cyElement();

		// 2. 初始化 Cytoscape 實例
		this.cy = cytoscape({
			container: this.cyCanvas.nativeElement,
			elements: initialElements,

			// 3. 設定節點與連線的樣式 (精細客製化)
			style: [
				{
					selector: "node",
					style: {
						label: "data(name)",
						width: "60px",
						height: "60px",
						"background-color": (ele) =>
							ele.data("type") === "folder"
								? "#FFB300"
								: "#29B6F6", // 資料夾橘色，檔案藍色
						shape: (ele) =>
							ele.data("type") === "folder"
								? "round-rectangle"
								: "ellipse",
						color: "#333",
						"font-size": "12px",
						"text-valign": "bottom",
						"text-margin-y": 8,
						"overlay-padding": "6px",
						"transition-property":
							"background-color, width, height",
						"transition-duration": 0.3,
					},
				},
				{
					selector: "edge",
					style: {
						width: 2,
						"line-color": "#BDBDBD",
						"curve-style": "bezier", // 網狀圖建議用 bezier 避開重疊
						"target-arrow-shape": "triangle", // 箭頭指向
						"target-arrow-color": "#BDBDBD",
					},
				},
				{
					selector: "node:selected", // 點擊選取時的樣式
					style: {
						"background-color": "#4CAF50",
						"border-width": "4px",
						"border-color": "#81C784",
					},
				},
			],

			// 4. 設定動態網狀佈局 (Cola)
			layout: this.getLayoutConfig(),
		});

		// 5. 綁定事件監聽：點擊節點觸發「分批載入」
		this.cy.on("tap", "node", (evt) => {
			const clickedNode = evt.target;
			this.handleNodeClick(clickedNode);

			const nodeData = clickedNode.data();
			this.conceptSelectionStore.nodeSelection.toggleSelect(nodeData.id);
		});

		this.cy.on("tap", (event) => {
			if (event.target === this.cy) {
				console.log("使用者點擊了畫布空白處");
				this.conceptSelectionStore.nodeSelection.clearSelection();
			}
		});
	}

	// 封裝佈局設定，因為每次加入新節點都要重新執行佈局
	private getLayoutConfig() {
		return {
			name: "cola",
			animate: true,
			refresh: 1,
			maxSimulationTime: 1000,
			fit: true,
			padding: 50,
			nodeSpacing: 40, // 節點彼此的間距
			edgeLength: 100, // 連線的長度
		};
	}

	// 處理點擊與動態分批載入
	private handleNodeClick(node: cytoscape.NodeSingular) {
		const nodeData = node.data();

		// 如果是檔案，或是已經載入過的資料夾，就不要重複載入
		if (nodeData.type !== "folder" || nodeData.isLoaded) {
			console.log(`開啟檔案/資料夾: ${nodeData.label}`);
			return;
		}

		const parentId = nodeData.id;
		console.log(`向後端請求 ${nodeData.label} 的關聯子檔案...`);

		// 模擬從後端 API 獲取的分批新資料 (2 個檔案，1 個交叉引用的標籤)
		setTimeout(() => {
			const mockBackendData = [
				{
					id: `file_${parentId}_1`,
					label: "專案合約.pdf",
					type: "file",
				},
				{ id: `file_${parentId}_2`, label: "架構圖.png", type: "file" },
				{ id: `tag_shared`, label: "標籤:急件", type: "folder" }, // 也可以做成標籤類型，這邊用 folder 模擬
			];

			// 標記該節點已載入，避免重複觸發 API
			node.data("isLoaded", true);

			// 動態將新節點與連線加入到圖表中
			mockBackendData.forEach((item) => {
				// 1. 新增節點 (如果圖面上已有該節點如共享標籤，Cytoscape 會自動忽略，不會重複建立)
				if (this.cy.$(`#${item.id}`).length === 0) {
					this.cy.add({
						group: "nodes",
						data: {
							id: item.id,
							label: item.label,
							type: item.type,
							isLoaded: false,
						},
					});
				}

				// 2. 新增從父節點連到子節點的線
				this.cy.add({
					group: "edges",
					data: {
						id: `edge_${parentId}_${item.id}`,
						source: parentId,
						target: item.id,
					},
				});
			});

			// 重要：加入新節點後，重新跑一次佈局動畫，讓圖表平滑擴散
			const layout = this.cy.layout(this.getLayoutConfig());
			layout.run();
		}, 400); // 模擬網路延遲 400ms
	}

	zoomAtCenter(isZoomIn: boolean) {
		const currentZoom = this.cy.zoom();
		const newZoom = isZoomIn
			? currentZoom + this.zoomStep
			: currentZoom - this.zoomStep;

		if (newZoom <= 0) return;

		// 取得目前畫布容器的中心像素座標
		const containerWidth = this.cyCanvas.nativeElement.clientWidth;
		const containerHeight = this.cyCanvas.nativeElement.clientHeight;

		this.cy.zoom({
			level: newZoom,
			renderedPosition: { x: containerWidth / 2, y: containerHeight / 2 },
		});
	}

	zoomIn() {
		this.zoomAtCenter(true);
	}

	zoomOut() {
		this.zoomAtCenter(false);
	}

	fitGraph() {
		this.cy.fit(); // 可帶入 padding 參數，例如：this.cy.fit(null, 50);
	}

	resetGraph() {
		this.cy.reset();
	}
}

import {
	Component,
	computed,
	effect,
	forwardRef,
	inject,
	linkedSignal,
	viewChild,
} from "@angular/core";
import { ConfirmationService, MessageService } from "@openng/optimus-ui/api";
import { ButtonModule } from "@openng/optimus-ui/button";
import { ConfirmDialogModule } from "@openng/optimus-ui/confirmdialog";
import { ToastModule } from "@openng/optimus-ui/toast";
import { ArchiveSelectionStore } from "@/features/archive-selection";
import {
	type DeletePayload,
	DeletePayloadSchema,
} from "@/pages/ontology/model";
import { DefaultService } from "@/shared/api/default/default.service";
import { OverlayComponent } from "@/shared/ui/overlay";
import {
	INSPECT_STRATEGY,
	type InspectStrategy,
	UiIntentStore,
	UiToken,
} from "@/shared/ui-intent";
import { HeaderComponent } from "@/widgets/header";
import { ItemListComponent } from "@/widgets/item-list";
import { LeftSidebarComponent } from "./left-sidebar/left-sidebar.component";
import { RightSidebarComponent } from "./right-sidebar/right-sidebar.component";

@Component({
	selector: "page-explorer",
	standalone: true,
	imports: [
		ItemListComponent,
		HeaderComponent,
		LeftSidebarComponent,
		RightSidebarComponent,
		OverlayComponent,
		ToastModule,
		ButtonModule,
		ConfirmDialogModule,
	],
	templateUrl: "./explorer.component.html",
	providers: [
		ConfirmationService,
		MessageService,
		ArchiveSelectionStore,
		UiIntentStore,
		{
			provide: INSPECT_STRATEGY,
			useExisting: forwardRef(() => ExplorerPage),
		},
	],
})
export class ExplorerPage implements InspectStrategy {
	readonly leftSidebarEl = viewChild(LeftSidebarComponent);
	readonly rightSidebarEl = viewChild(RightSidebarComponent);
	readonly itemListEl = viewChild(ItemListComponent);
	private confirmationService = inject(ConfirmationService);
	private readonly defaultService = inject(DefaultService);
	private messageService = inject(MessageService);
	readonly archiveSelectionStore = inject(ArchiveSelectionStore);

	leftRequireOverlay = computed(() => {
		return !!this.leftSidebarEl()?.sidebarEl()?.store.requireOverlay();
	});

	rightRequireOverlay = computed(() => {
		return !!this.rightSidebarEl()?.sidebarEl()?.store.requireOverlay();
	});

	private _sourceOpen = computed(() => {
		return this.leftRequireOverlay() || this.rightRequireOverlay();
	});

	isOpen = linkedSignal({
		source: this._sourceOpen,
		computation: (newVal) => newVal,
	});

	leftWidth = computed(() => {
		return this.leftSidebarEl()?.sidebarEl()?.store.width() || "0px";
	});

	leftControlPanelWidth = computed(() => {
		return (
			this.leftSidebarEl()?.sidebarEl()?.store.controlPanelWidth() ||
			"0px"
		);
	});

	rightWidth = computed(() => {
		return this.rightSidebarEl()?.sidebarEl()?.store.width() || "0px";
	});

	rightControlPanelWidth = computed(() => {
		return (
			this.rightSidebarEl()?.sidebarEl()?.store.controlPanelWidth() ||
			"0px"
		);
	});

	private get leftStore() {
		return this.leftSidebarEl()?.sidebarEl()?.store;
	}
	private get rightStore() {
		return this.rightSidebarEl()?.sidebarEl()?.store;
	}

	onDispatch(token: UiToken, payload: unknown): void {
		switch (token) {
			case UiToken.CLOSE_OVERLAY:
				if (
					this.leftStore &&
					!this.leftStore.collapsed() &&
					!this.leftStore.pinned()
				) {
					this.leftStore.setCollapsed(true);
				} else if (
					this.rightStore &&
					!this.rightStore.collapsed() &&
					!this.rightStore.pinned()
				) {
					this.rightStore.setCollapsed(true);
				}
				console.log(`[開啟] 面板 ${token} 已載入資料:`, payload);
				break;

			case UiToken.EXPANDED:
				this.rightStore?.setExpanded(true);
				break;
			case UiToken.DELETE: {
				const result = DeletePayloadSchema.safeParse(payload);

				if (result.success) {
					this.confirmDelete(result.data);
				}

				break;
			}
		}
	}

	onClear(token: UiToken): void {
		console.log(`[關閉] 使用者手動關閉了 ${token} 面板`);
	}

	onClearAll(): void {
		console.log("[全部關閉] 所有面板都已收合");
	}

	confirmDelete({ event, ids }: DeletePayload) {
		this.confirmationService.confirm({
			target: event.target as HTMLElement,
			message: "您確定要刪除這筆資料嗎？資料刪除後將無法復原。",
			header: "刪除確認",
			icon: "pi pi-exclamation-triangle", // 根據你設定的字體圖標調整
			acceptLabel: "確定",
			rejectLabel: "取消",
			rejectButtonStyleClass: "p-button-secondary p-button-text",
			acceptButtonStyleClass: "p-button-danger",

			// 點擊「確定」的回呼函式
			accept: () => {
				this.messageService.add({
					severity: "info",
					summary: "已確認",
					detail: "資料已成功刪除",
				});

				this.defaultService.postApiV1ArchiveDelete(
					ids.map((item) => {
						return { id: item.id };
					}),
				);
			},
			// 點擊「取消」或關閉彈窗的回呼函式
			reject: () => {
				this.messageService.add({
					severity: "error",
					summary: "已取消",
					detail: "操作已取消",
				});
			},
		});
	}
}

import {
	Component,
	computed,
	Injector,
	inject,
	viewChild,
} from "@angular/core";
import { ConfirmationService, MessageService } from "@openng/optimus-ui/api";
import { ButtonModule } from "@openng/optimus-ui/button";
import { ConfirmDialogModule } from "@openng/optimus-ui/confirmdialog";
import { ToastModule } from "@openng/optimus-ui/toast";
import { ConceptEntryStore } from "@/entities/concept";
import { ConceptRegistryComponent } from "@/features/concept-registry";
import { DefaultService } from "@/shared/api/default/default.service";
import { SidebarComponent } from "@/shared/ui/sidebar";
import { INSPECT_STRATEGY, UiIntentStore, UiToken } from "@/shared/ui-intent";
import { ConceptExplorerComponent } from "@/widgets/concept-explorer";
import { HeaderComponent } from "@/widgets/header";
import { type DeletePayload, DeletePayloadSchema } from "../model";
import { RightSidebarComponent } from "./right-sidebar";

@Component({
	selector: "page-ontology",
	standalone: true,
	imports: [
		SidebarComponent,
		ConceptRegistryComponent,
		ConceptExplorerComponent,
		HeaderComponent,
		ToastModule,
		ButtonModule,
		ConfirmDialogModule,
		RightSidebarComponent,
	],
	templateUrl: "./ontology.component.html",
	providers: [
		ConfirmationService,
		MessageService,
		UiIntentStore,
		{
			provide: INSPECT_STRATEGY,

			useFactory: () => {
				const injector = inject(Injector);

				return {
					onDispatch: (token: UiToken, payload: unknown) => {
						const page = injector.get(OntologyPage);
						const sidebar = page.rightSidebarEl()?.sidebarEl();

						switch (token) {
							case UiToken.OPEN_REGISTRY:
								if (sidebar) {
									console.log(
										`[開啟] 成功存取 Sidebar 指令`,
										sidebar,
									);
									sidebar.store.setCollapsed(false);
								}
								console.log(
									`[開啟] 面板 ${token} 已載入資料:`,
									payload,
								);
								break;
							case UiToken.DELETE: {
								const result =
									DeletePayloadSchema.safeParse(payload);
								if (result.success) {
									page.confirmDelete(result.data);
								}

								break;
							}
						}
					},
					onClear: (token: UiToken) => {
						console.log(`[關閉] 使用者手動關閉了 ${token} 面板`);
					},
					onClearAll: () => {
						console.log("[全部關閉] 所有面板都已收合");
					},
				};
			},
		},
	],
})
export class OntologyPage {
	private readonly defaultService = inject(DefaultService);
	private confirmationService = inject(ConfirmationService);
	private messageService = inject(MessageService);
	private conceptEntryStore = inject(ConceptEntryStore);

	readonly rightSidebarEl = viewChild(RightSidebarComponent);

	width = computed(() => {
		return this.rightSidebarEl()?.sidebarEl()?.store.width() || "0px";
	});

	totalWidth = computed(() => {
		return this.rightSidebarEl()?.sidebarEl()?.store.totalWidth() || "0px";
	});

	controlPanelWidth = computed(() => {
		return (
			this.rightSidebarEl()?.sidebarEl()?.store.controlPanelWidth() ||
			"0px"
		);
	});

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

				this.defaultService.postApiV1OntologyDelete({
					notifyId: this.conceptEntryStore.notifyId,
					idList: ids.map((item) => item.id),
				});
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

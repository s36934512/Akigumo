import { isPlatformBrowser } from "@angular/common";
import {
	afterNextRender,
	Component,
	DestroyRef,
	inject,
	PLATFORM_ID,
} from "@angular/core";
import { DashboardComponent } from "@uppy/angular";
import Dashboard from "@uppy/dashboard";

import { UppyStoreService } from "../../api/uppy-store.service";

@Component({
	selector: "feature-uppy-dashboard",
	standalone: true,
	imports: [DashboardComponent],
	templateUrl: "uppy-dashboard.component.html",
})
export class UppyDashboardComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly platformId = inject(PLATFORM_ID);
	protected readonly uppyStoreService = inject(UppyStoreService);

	protected isBrowser = false;

	constructor() {
		const isBrowser = isPlatformBrowser(this.platformId);

		// 透過 afterNextRender 確保 Uppy 只在瀏覽器環境初始化
		afterNextRender(() => {
			this.isBrowser = true;

			if (!this.uppyStoreService.uppy.getPlugin("Dashboard")) {
				this.uppyStoreService.uppy.use(Dashboard, {
					showLinkToFileUploadResult: false,
					hideProgressDetails: false,
					note: "支援斷點續傳，網頁關閉後再次選取相同檔案即可續傳。",
				});
			}
		});

		this.destroyRef.onDestroy(() => {
			// 關鍵修正：只有在瀏覽器環境，且 uppy 實例存在時才進行移除外掛
			if (isBrowser && this.uppyStoreService?.uppy) {
				const dashboardPlugin =
					this.uppyStoreService.uppy.getPlugin("Dashboard");
				if (dashboardPlugin) {
					this.uppyStoreService.uppy.removePlugin(dashboardPlugin);
				}
			}
		});
	}
}

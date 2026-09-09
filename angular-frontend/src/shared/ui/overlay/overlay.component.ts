import { CdkTrapFocus } from "@angular/cdk/a11y";

import { Component, HostListener, inject, model } from "@angular/core";
import { UiIntentStore, UiToken } from "@/shared/ui-intent";

@Component({
	selector: "shared-overlay",
	standalone: true,
	imports: [CdkTrapFocus],
	templateUrl: "./overlay.component.html",
	styleUrl: "./overlay.component.scss",
})
export class OverlayComponent {
	private uiIntentStore = inject(UiIntentStore);

	isOpen = model(false);

	// 核心功能：鍵盤 ESC 防護
	@HostListener("window:keydown.escape")
	onEscape() {
		if (this.isOpen()) {
			this.close();
		}
	}

	close() {
		this.isOpen.set(false);
		this.uiIntentStore.dispatch(UiToken.CLOSE_OVERLAY);
	}
}

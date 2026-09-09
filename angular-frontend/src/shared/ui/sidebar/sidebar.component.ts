import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { ControlPanelComponent } from "./control-panel/control-panel.component";
import { SidebarStore } from "./model/sidebar.store";

@Component({
	selector: "shared-sidebar",
	standalone: true,
	imports: [CommonModule, ControlPanelComponent],
	templateUrl: "./sidebar.component.html",
})
export class SidebarComponent {
	public store = inject(SidebarStore);

	readonly containerClasses = computed(() => {
		const classes = [
			"absolute h-full flex font-sans group pointer-events-none",
		];

		classes.push(
			this.store.reversed()
				? "flex-row-reverse right-0"
				: "flex-row left-0",
		);

		return classes.join(" ");
	});

	readonly sidebarClasses = computed(() => {
		return "h-full overflow-hidden shrink-0 duration-300 ease-in-out pointer-events-auto";
	});

	readonly sidebarStyles = computed(() => {
		if (this.store.pinned()) {
			const width = this.store.collapsed()
				? this.store.pinnedCollapseWidth()
				: this.store.baseWidth();
			return { width };
		} else {
			const width = this.store.collapsed()
				? this.store.unpinnedCollapseWidth()
				: this.store.baseWidth();
			return { width };
		}
	});

	// 5. 擴充面板樣式
	readonly expandedClasses = computed(() => {
		return `h-full transition-[width] duration-300 ease-in-out pointer-events-auto ${
			this.store.expanded() ? "overflow-visible" : "w-0 overflow-hidden"
		}`;
	});

	readonly expandedStyles = computed(() => ({
		width: this.store.expanded() ? this.store.expandedWidth() : "0px",
	}));

	readonly controlPanelClasses = computed(() => {
		const classes = [
			"block pt-24 shrink-0 transition-[width] duration-300",
		];

		classes.push(
			this.store.collapsed()
				? "opacity-0 group-hover:opacity-100"
				: "opacity-100",
		);

		return classes.join(" ");
	});

	readonly style = { "font-variation-settings": "'FILL' 1" };
}

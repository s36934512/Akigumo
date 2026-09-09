import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { SidebarStore } from "../model/sidebar.store";

@Component({
	selector: "shared-sidebar-control-panel",
	standalone: true,
	imports: [CommonModule],
	templateUrl: "./control-panel.component.html",
})
export class ControlPanelComponent {
	public store = inject(SidebarStore);

	readonly controlPanelClasses = computed(() => {
		const classes = [
			"flex flex-col mt-24 gap-2 rounded-r items-center justify-center",
			"shrink-0 transition-[width] duration-300 pointer-events-none",
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

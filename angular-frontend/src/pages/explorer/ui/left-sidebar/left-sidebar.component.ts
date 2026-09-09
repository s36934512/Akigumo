import { Component, viewChild } from "@angular/core";

import { SidebarComponent, SidebarStore } from "@/shared/ui/sidebar";

import { NavigationSidebarComponent } from "@/widgets/navigation-sidebar";

@Component({
	selector: "page-explorer-left-sidebar",
	standalone: true,
	imports: [NavigationSidebarComponent, SidebarComponent],
	templateUrl: "./left-sidebar.component.html",
	providers: [SidebarStore],
})
export class LeftSidebarComponent {
	readonly sidebarEl = viewChild(SidebarComponent);
}

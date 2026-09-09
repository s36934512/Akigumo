import { Component, computed, inject } from "@angular/core";
import { isActive, Router } from "@angular/router";

import { THEME } from "@/shared/themes/theme";
import { SidebarStore } from "@/shared/ui/sidebar";
import { MENU, type NavItem } from "./router";

@Component({
	selector: "widget-navigation-sidebar-navigation",
	templateUrl: "./navigation.component.html",
	standalone: true,
})
export class NavigationComponent {
	private router = inject(Router);

	protected store = inject(SidebarStore);

	readonly theme = THEME;
	readonly menuItems = MENU;

	readonly activeItem = computed(() => {
		return (
			this.menuItems.find((item) => {
				return isActive(item.routerLink, this.router, {
					paths: "subset",
				})();
			}) || null
		);
	});

	navByActiveItem(item: NavItem) {
		this.router.navigateByUrl(item.routerLink);
	}
}

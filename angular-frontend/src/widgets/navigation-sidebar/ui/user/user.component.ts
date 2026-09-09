import { Component, inject } from "@angular/core";
import { THEME } from "@/shared/themes/theme";
import { SidebarStore } from "@/shared/ui/sidebar";

@Component({
	selector: "widget-navigation-sidebar-user",
	templateUrl: "./user.component.html",
	standalone: true,
})
export class UserComponent {
	protected store = inject(SidebarStore);

	readonly theme = THEME;
}

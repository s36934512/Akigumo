import { Component, inject } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { THEME } from "@/shared/themes/theme";
import { SidebarStore } from "@/shared/ui/sidebar";

@Component({
	selector: "widget-navigation-sidebar-logo",
	templateUrl: "./logo.component.html",
	standalone: true,
	imports: [MatTooltipModule],
})
export class LogoComponent {
	protected store = inject(SidebarStore);

	readonly theme = THEME;
}

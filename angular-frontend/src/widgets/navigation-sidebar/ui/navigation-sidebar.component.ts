import { Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { THEME } from "@/shared/themes/theme";
import { SidebarStore } from "@/shared/ui/sidebar";
import { LogoComponent } from "./logo/logo.component";
import { NavigationComponent } from "./navigation/navigation.component";
import { UserComponent } from "./user/user.component";

@Component({
	selector: "widget-navigation-sidebar",
	standalone: true,
	imports: [
		MatSidenavModule,
		MatIconModule,
		MatToolbarModule,
		UserComponent,
		LogoComponent,
		NavigationComponent,
	],
	templateUrl: "./navigation-sidebar.component.html",
})
export class NavigationSidebarComponent {
	protected store = inject(SidebarStore);

	readonly theme = THEME;

	constructor() {
		this.store.updateState({
			baseWidth: "12rem",
			pinnedCollapseWidth: "4rem",
			controlPanelStyles: {
				"background-color": this.theme.darkGray,
			},
			buttonStyles: {
				color: this.theme.pureWhite,
			},
		});
	}
}

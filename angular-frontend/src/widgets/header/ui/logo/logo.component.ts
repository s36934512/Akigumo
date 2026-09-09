import { Component } from "@angular/core";
import { MatTooltipModule } from "@angular/material/tooltip";
import { THEME } from "@/shared/themes/theme";

@Component({
	selector: "widget-navigation-sidebar-logo",
	templateUrl: "./logo.component.html",
	standalone: true,
	imports: [MatTooltipModule],
})
export class LogoComponent {
	readonly theme = THEME;
}

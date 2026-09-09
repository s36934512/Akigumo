import { PortalModule, type TemplatePortal } from "@angular/cdk/portal";
import { Component, Input } from "@angular/core";

@Component({
	selector: "shared-overlay-panel",
	standalone: true,
	imports: [PortalModule],
	templateUrl: "./overlay-panel.component.html",
})
export class OverlayPanelComponent {
	@Input() contentPortal!: TemplatePortal;
}

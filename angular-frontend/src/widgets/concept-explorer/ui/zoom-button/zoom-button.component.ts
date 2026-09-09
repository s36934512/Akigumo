import { Component, output } from "@angular/core";

@Component({
	selector: "widget-concept-explorer-zoom-button",
	templateUrl: "./zoom-button.component.html",
	standalone: true,
})
export class ZoomButtonComponent {
	onZoomIn = output<void>();
	onZoomOut = output<void>();
	onFit = output<void>();
	onReset = output<void>();
}

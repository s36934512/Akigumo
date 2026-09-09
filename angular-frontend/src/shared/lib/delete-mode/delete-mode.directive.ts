import { Directive, HostListener, input, signal } from "@angular/core";

@Directive({
	selector: "[deleteModeDirective]",
	standalone: true,
	exportAs: "deleteMode",
})
export class DeleteModeDirective {
	private _isSelected = signal(false);

	onMode = input(false);

	isSelected = this._isSelected.asReadonly();

	@HostListener("click", ["$event"])
	onClick(event: Event) {
		event.preventDefault();

		if (this.onMode()) {
			this._isSelected.update((v) => !v);
		}
	}
}

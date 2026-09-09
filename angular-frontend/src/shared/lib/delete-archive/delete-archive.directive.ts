import { Directive, HostListener, inject, input, signal } from "@angular/core";
import { DefaultService } from "@/shared/api/default/default.service";

@Directive({
	selector: "[deleteArchiveDirective]",
	standalone: true,
	exportAs: "deleteArchive",
})
export class DeleteArchiveDirective {
	private readonly defaultService = inject(DefaultService);

	id = input.required<string>();

	@HostListener("click", ["$event"])
	onClick(event: Event) {
		event.preventDefault();

		this.defaultService.postApiV1ArchiveDelete([
			{
				id: this.id(),
			},
		]);
	}
}

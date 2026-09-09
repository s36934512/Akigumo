import { Directive, Input, inject } from "@angular/core";
import { Router } from "@angular/router";

@Directive({
	selector: "[featureNavToDetail]",
	standalone: true,
	host: {
		"(dblclick)": "ondbClick()",
	},
})
export class NavigateToDetailDirective {
	@Input("featureNavToDetail") entryId!: string;

	private router = inject(Router);

	ondbClick() {
		this.router.navigate(["/detail", this.entryId]);
	}
}

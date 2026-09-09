import { Directive, inject } from "@angular/core";
import { SidebarStore } from "./sidebar.store";

@Directive({
	selector: "[sidebarStoreDirective]",
	standalone: true,
	providers: [SidebarStore],
	exportAs: "sidebarStore",
})
export class SidebarStoreDirective {
	readonly store = inject(SidebarStore);
}

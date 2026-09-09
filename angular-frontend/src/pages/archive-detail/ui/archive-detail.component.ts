import { Component, input } from "@angular/core";

import {
	SIDEBAR_INITIAL_STATE,
	SidebarComponent,
	SidebarStoreDirective,
} from "@/shared/ui/sidebar";
import { ArchiveDetailComponent } from "@/widgets/archive-detail";
import { HeaderComponent } from "@/widgets/header";
import { NavigationSidebarComponent } from "@/widgets/navigation-sidebar";

@Component({
	selector: "page-archive-detail",
	standalone: true,
	imports: [
		HeaderComponent,
		ArchiveDetailComponent,
		SidebarStoreDirective,
		NavigationSidebarComponent,
		SidebarComponent,
	],
	templateUrl: "./archive-detail.component.html",
	providers: [
		{
			provide: SIDEBAR_INITIAL_STATE,
			useValue: {
				collapsed: true,
			},
		},
	],
})
export class ArchiveDetailPage {
	id = input.required<string>();
}

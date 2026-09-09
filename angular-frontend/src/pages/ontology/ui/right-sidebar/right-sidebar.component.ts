import { Component, viewChild } from "@angular/core";

import { ConceptRegistryComponent } from "@/features/concept-registry";
import {
	SIDEBAR_INITIAL_STATE,
	SidebarComponent,
	SidebarStore,
} from "@/shared/ui/sidebar";

@Component({
	selector: "page-ontology-right-sidebar",
	standalone: true,
	imports: [ConceptRegistryComponent, SidebarComponent],
	templateUrl: "./right-sidebar.component.html",
	providers: [
		SidebarStore,
		{
			provide: SIDEBAR_INITIAL_STATE,
			useValue: {
				reversed: true,
				collapsed: true,
				pinnedCollapseWidth: "0px",
			},
		},
	],
})
export class RightSidebarComponent {
	readonly sidebarEl = viewChild(SidebarComponent);
}

import { Component, input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

import type { PostApiV1OntologyResolver200NodesItemData } from "@/shared/api/model/postApiV1OntologyResolver200NodesItemData";

@Component({
	selector: "entity-concept-tag",
	standalone: true,
	imports: [MatButtonModule],
	templateUrl: "./tag.component.html",
})
export class TagComponent {
	entry = input.required<PostApiV1OntologyResolver200NodesItemData>();
}

import { Component, Input } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ToolbarComponent } from '../toolbar';
import { ContentEntityGalleryComponent } from '../../components/content-entity-gallery';

@Component({
    selector: 'app-explorer-list',
    standalone: true,
    imports: [
        FormsModule,
        ToolbarComponent,
        ContentEntityGalleryComponent,
    ],
    templateUrl: './explorer-list.component.html',
    styleUrls: ['./explorer-list.component.scss'],
})
export class ExplorerListComponent {
    @Input() deleteMode = false;
}

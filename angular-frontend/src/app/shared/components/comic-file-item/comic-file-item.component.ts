import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComicFileItemViewmodelService } from './comic-file-item-viewmodel.service';

@Component({
    selector: 'app-comic-file-item',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './comic-file-item.component.html',
    providers: [ComicFileItemViewmodelService]
})
export class ComicFileItemComponent {
    constructor(
        public viewModelService: ComicFileItemViewmodelService,
    ) { }
}

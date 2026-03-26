import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { ComicEditDataService } from '../../comic-edit-data.service';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss'],
    standalone: true,
    imports: [ButtonModule, FormsModule, AsyncPipe],
})
export class ToolbarComponent {
    constructor(public comicEditData: ComicEditDataService) { }
}

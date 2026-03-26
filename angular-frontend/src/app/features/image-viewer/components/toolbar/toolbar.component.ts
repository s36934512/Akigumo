import { Component } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { ChipModule } from 'primeng/chip';

import { ImageViewerDataService } from '../../image-viewer.service';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    standalone: true,
    imports: [
        ButtonModule,
        ToolbarModule,
        ButtonGroupModule,
        FormsModule,
        AsyncPipe,
        DecimalPipe,
        ChipModule
    ],
})
export class ToolbarComponent {
    constructor(public imageViewerDataService: ImageViewerDataService) { }
}

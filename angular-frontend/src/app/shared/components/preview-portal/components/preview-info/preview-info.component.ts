import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { PreviewPortalViewModelService } from '../../preview-portal-viewmodel.service';

@Component({
    selector: 'app-preview-info',
    standalone: true,
    templateUrl: './preview-info.component.html',
    imports: [AsyncPipe]
})
export class PreviewInfoComponent {
    constructor(public viewModelService: PreviewPortalViewModelService) { }
}

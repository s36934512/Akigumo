import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { CommunicationService } from '../../communication';

@Component({
    selector: 'app-page-grid',
    templateUrl: './page-grid.component.html',
    imports: [AsyncPipe],
})
export class PageGridComponent {
    constructor(public communicationService: CommunicationService) { }
}

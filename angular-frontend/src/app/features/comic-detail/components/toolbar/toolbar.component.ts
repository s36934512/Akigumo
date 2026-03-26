import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { CommunicationService } from '../../communication';

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    standalone: true,
    imports: [ButtonModule, FormsModule, AsyncPipe],
})
export class ToolbarComponent {
    constructor(public communicationService: CommunicationService) { }
}

import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { LayoutDataService } from '../../layout-data.service';

@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    standalone: true,
    imports: [AsyncPipe]
})
export class LogoComponent {
    constructor(public layoutDataService: LayoutDataService) { }
}
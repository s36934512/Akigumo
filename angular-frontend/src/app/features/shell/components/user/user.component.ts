import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { LayoutDataService } from '../../layout-data.service';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
    standalone: true,
    imports: [AsyncPipe]
})
export class UserComponent {
    constructor(public layoutDataService: LayoutDataService) { }
}
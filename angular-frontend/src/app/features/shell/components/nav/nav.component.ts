import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Observable } from 'rxjs';

import { LayoutDataService } from '../../layout-data.service';
import { NavItem } from '../../router.types';
import { UploadService } from '@core/services/upload.service';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    standalone: true,
    imports: [AsyncPipe]
})
export class NavComponent {
    pendingCount$: Observable<number>;
    processedCount$: Observable<number>;

    constructor(
        public layoutDataService: LayoutDataService,
        private router: Router,
        private uploadService: UploadService
    ) {
        this.pendingCount$ = this.uploadService.pendingCount$;
        this.processedCount$ = this.uploadService.processedCount$;

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            const current = this.layoutDataService.menuItems.find(
                item => this.router.url.startsWith(item.routerLink)
            );
            if (current) {
                this.layoutDataService.setActiveItem(current);
            }
        });
    }

    navByActiveItem(item: NavItem) {
        this.router.navigateByUrl(item.routerLink);
    }
}
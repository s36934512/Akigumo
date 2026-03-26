import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-sidebar-layout',
    standalone: true,
    imports: [CommonModule, MatSidenavModule, MatIconModule, MatToolbarModule],
    templateUrl: './sidebar-layout.component.html',
    styleUrls: ['./sidebar-layout.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SidebarLayoutComponent {
    opened = true;
    @Input() menuIcon: string = 'menu';
    @Input() collapsedIcon: string = 'menu';
    @Input() customStyles: any = {};

    toggleSidebar(sidenav: any) {
        sidenav.toggle();
    }
}

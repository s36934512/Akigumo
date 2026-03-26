import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { SidebarLayoutComponent } from './sidebar-layout.component';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, MatSidenavModule, SidebarLayoutComponent, MatListModule, MatToolbarModule, MatIconModule, MatSidenavModule],
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SidebarComponent {
    toggleSidebar(sidenav: any) {
        sidenav.toggle();
    }

    @Input() menuItems: Array<{ label: string; link: string }> = [
        { label: '首頁', link: '/home' },
        { label: '漫畫列表', link: '/comic-list' },
        { label: '上傳漫畫', link: '/comic-upload' },
        { label: '垃圾桶', link: '/trash' },
        { label: '設定', link: '/settings' }
    ];

    sidebarOpened = true;
    buttons: Array<{ id: string; label: string }> = [
        { id: 'a', label: '功能A' },
        { id: 'b', label: '功能B' }
    ];
    selectedBtn: { id: string; label: string } | null = null;

    select(btn: { id: string; label: string }) {
        this.selectedBtn = btn;
    }
}

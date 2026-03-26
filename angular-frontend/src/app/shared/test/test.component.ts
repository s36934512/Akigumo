import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-test',
    templateUrl: './test.component.html',
    styleUrls: ['./test.component.scss'],
    standalone: true,
    imports: [CommonModule, ButtonModule]
})
export class TestComponent {
    sidebarVisible = true;                // 最外層收合
    activePanel: string | null = null;    // 哪個面板被打開
    previousActivePanel: string | null = null; // 紀錄先前打開的面板
    @Input() comic: any;
    previewPage = 0;

    toggleSidebar() {
        this.sidebarVisible = !this.sidebarVisible;
        if (!this.sidebarVisible) {
            this.previousActivePanel = this.activePanel; // 紀錄先前打開的面板
            this.activePanel = null; // 全收合時關閉面板
        } else {
            this.activePanel = this.previousActivePanel; // 展開時恢復先前面板
        }
    }

    openPanel(panel: string) {
        this.activePanel = this.activePanel === panel ? null : panel;
    }
}

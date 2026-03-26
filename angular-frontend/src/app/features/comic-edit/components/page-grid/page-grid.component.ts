import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';

import { ComicEditDataService } from '../../comic-edit-data.service';

import { PageItem } from '@models/comic.types';

@Component({
    selector: 'app-page-grid',
    templateUrl: './page-grid.component.html',
    styleUrls: ['./page-grid.component.scss'],
    imports: [CdkDropList, CdkDrag, AsyncPipe],
})
export class PageGridComponent {
    constructor(public comicEditData: ComicEditDataService) { }

    drop(event: CdkDragDrop<PageItem[]>) {
        this.comicEditData.updatePageOrder(event.previousIndex, event.currentIndex);
    }

    deletePage(page: PageItem, event: MouseEvent) {
        event.stopPropagation(); // 阻止事件冒泡 (UI 邏輯)

        if (confirm('確定要移除此頁面嗎？')) {
            this.comicEditData.deletePage(page.id);
        }
    }
}

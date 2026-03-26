
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '@shared/sidebar/sidebar.component';
import { LayoutComponent } from '@features/shell/layout';
import { ComicFileItemComponent } from '@shared/components/comic-file-item/comic-file-item.component';
import { DataViewModule } from 'primeng/dataview';

@Component({
    selector: 'app-trash',
    standalone: true,
    imports: [CommonModule, RouterModule, LayoutComponent, SidebarComponent, ComicFileItemComponent, DataViewModule],
    templateUrl: './trash.html',
    styleUrls: ['./trash.scss']
})
export class TrashComponent implements OnInit {
    comics: any[] = [];
    loading = false;
    error = '';
    sidebarCollapsed = false;
    selectedComics: Set<any> = new Set();

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.fetchTrashComics();
    }

    async fetchTrashComics() {
        this.loading = true;
        try {
            const res = await fetch('/api/trash');
            const data = await res.json();
            if (res.ok) {
                this.comics = data.comics;
            } else {
                this.error = data.error || '載入失敗';
            }
        } catch (err: any) {
            this.error = err.message || '載入失敗';
        }
        this.loading = false;
        console.log('Fetched trash comics:', this.comics);
        this.cdr.detectChanges();
    }

    async restoreComic() {
        let ids: number[] = [];
        ids = Array.from(this.selectedComics).map((c: any) => c.comic_id);

        this.loading = true;
        this.error = '';
        try {
            console.log('Restoring comics with IDs:', ids);
            const res = await fetch('/api/comics', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, status: 'active' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // 更新本地狀態
                this.comics = this.comics.filter(c =>
                    !ids.includes(c.comic_id)
                );
                this.selectedComics.clear();
            } else {
                this.error = data.error || '刪除失敗';
            }
        } catch (err: any) {
            this.error = err.message || '刪除失敗';
        }
        this.loading = false;
        this.cdr.detectChanges();
    }

    async deleteComicPermanently() {
        let ids: number[] = [];
        ids = Array.from(this.selectedComics).map((c: any) => c.comic_id);

        this.loading = true;
        this.error = '';
        try {
            console.log('Restoring comics with IDs:', ids);
            const res = await fetch('/api/comics', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, status: 'deleted' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // 更新本地狀態
                this.comics = this.comics.filter(c =>
                    !ids.includes(c.comic_id)
                );
                this.selectedComics.clear();
            } else {
                this.error = data.error || '刪除失敗';
            }
        } catch (err: any) {
            this.error = err.message || '刪除失敗';
        }
        this.loading = false;
        this.cdr.detectChanges();
    }

    isComicSelected(comic: any): boolean {
        return this.selectedComics.has(comic);
    }

    onClick(comic: any, event: MouseEvent) {
        console.log('Comic clicked:', comic);
        this.toggleSelectComic(comic, event);
    }

    toggleSelectComic(comic: any, event?: Event) {
        if (event) event.stopPropagation();
        if (this.selectedComics.has(comic)) {
            this.selectedComics.delete(comic);
        } else {
            this.selectedComics.add(comic);
        }
        console.log('Selected comics:', this.selectedComics);
        this.cdr.detectChanges();
    }
}

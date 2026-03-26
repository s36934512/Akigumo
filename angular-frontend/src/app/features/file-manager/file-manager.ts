import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-file-manager',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './file-manager.html',
    styleUrls: ['./file-manager.scss']
})
export class FileManagerComponent {
    files: Array<{ name: string, path: string }> = [];
    loading = false;
    error = '';

    constructor(private http: HttpClient) {
        this.loadFiles();
    }

    loadFiles() {
        this.loading = true;
        this.http.get<any[]>('/api/file-manager/list').subscribe({
            next: files => {
                this.files = files;
                this.loading = false;
            },
            error: err => {
                this.error = err.message || '載入失敗';
                this.loading = false;
            }
        });
    }

    download(name: string) {
        window.open(`/api/file-manager/download/${encodeURIComponent(name)}`);
    }

    delete(name: string) {
        if (!confirm(`確定要刪除 ${name} 嗎？`)) return;
        this.http.delete(`/api/file-manager/delete/${encodeURIComponent(name)}`).subscribe({
            next: () => this.loadFiles(),
            error: err => alert('刪除失敗: ' + (err.message || ''))
        });
    }
}

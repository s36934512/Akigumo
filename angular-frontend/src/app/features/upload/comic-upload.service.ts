import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Tus from '@uppy/tus';
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';

export interface PreviewImage {
    url: string;
    originalUrl?: string;
    id?: string;
    filename?: string;
    mimetype?: string;
    data?: any;
}

@Injectable({ providedIn: 'root' })
export class ComicUploadService {
    constructor(private http: HttpClient) { }

    /**
     * Initialize Uppy instance with Tus protocol and Dashboard UI
     * Returns configured Uppy instance ready for use
     */
    initializeUppy(dashboardTargetSelector: string): Uppy {
        return new Uppy({
            restrictions: {
                maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
                maxNumberOfFiles: 20,
                allowedFileTypes: ['image/*', '.zip', '.rar', '.7z', '.pdf']
            },
            autoProceed: false
        })
            .use(Tus, {
                endpoint: 'api/tus/files',
                chunkSize: 5 * 1024 * 1024, // 5MB chunk
                retryDelays: [0, 1000, 3000, 5000],
            })
            .use(Dashboard, {
                target: dashboardTargetSelector,
                inline: true,
            });
    }

    async previewUploadFolder(files: FileList): Promise<{ previewKey: string, images: any[] } | { error: string }> {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            formData.append('files', file, (file as any).webkitRelativePath || file.name);
        }
        try {
            const data: any = await firstValueFrom(
                this.http.post('/api/preview-upload-folder', formData)
            );
            if (data.previewKey) {
                return { previewKey: data.previewKey, images: data.images };
            } else {
                return { error: data.error || '未知錯誤' };
            }
        } catch (err: any) {
            return { error: err.message };
        }
    }

    async previewUpload(file: File): Promise<{ images: any[] } | { error: string }> {
        const formData = new FormData();
        console.log('Preparing to upload file for preview:', file);
        formData.append('file', file, file.name);
        try {
            const data: any = await firstValueFrom(
                this.http.post('/api/preview', formData)
            );
            if (data.images) {
                return { images: data.images };
            } else {
                return { error: data.error || '未知錯誤' };
            }
        } catch (err: any) {
            return { error: err.message };
        }
    }

    async uploadComic(payload: any): Promise<{ success: boolean, page_count?: number, error?: string }> {
        try {
            const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
            const data: any = await firstValueFrom(
                this.http.post('/api/upload', payload, { headers })
            );
            if (data.success) {
                return { success: true, page_count: data.page_count };
            } else {
                return { success: false, error: data.error || '未知錯誤' };
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }
}

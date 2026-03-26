import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { CommunicationService } from './communication';
import { INITIAL_COMICFILE } from '@models/comic.types';

@Injectable()
export class DataService {
    constructor(private http: HttpClient, private communicationService: CommunicationService) { }

    baseComic = INITIAL_COMICFILE;
    fetchComic(id: string) {
        this.http.get(`/api/comics/${id}`).subscribe({
            next: (data: any) => {
                console.log('fetchComic response:', data);
                if (data && typeof data === 'object') {
                    const comic = data.comic;
                    this.baseComic.id = id;
                    this.baseComic.coverUrl = comic.cover_path;
                    this.baseComic.pages = comic.imageFiles.map((img: string, index: number) => ({
                        id: index,
                        url: img,
                        thumbnail: `/api/thumbnail?src=${encodeURIComponent(img)}&width=360&height=480`,
                        selected: false
                    }));
                    this.baseComic.editInfo = {
                        ...this.baseComic.editInfo,
                        title: comic.title,
                        author: comic.author.join(', '),
                        group: comic.group,
                        type: comic.type,
                        language: comic.language,
                        series: comic.series,
                        category: comic.category,
                        characters: comic.characters.join(', '),
                        tags: comic.tags.join(', '),
                        status: comic.status,
                        releaseDate: comic.release_date,
                        isPublic: comic.is_public,
                        description: comic.description,
                        editorNote: comic.editor_note,
                        ai_generated: comic.ai_generated
                    };
                    this.communicationService.setComicFile(this.baseComic);
                }
            },
            error: (err) => {
                console.error('發生錯誤', err);
            }
        });
    }

    async updateComic(id: string, payload: unknown): Promise<{ ok: boolean; comic?: any; error?: string }> {
        try {
            const data: any = await firstValueFrom(this.http.put(`/api/comics/${id}`, payload));
            if (data && data.comic) {
                return { ok: true, comic: data.comic };
            }
            return { ok: false, error: data?.error || '儲存失敗' };
        } catch (err: any) {
            return { ok: false, error: err?.message || '儲存失敗' };
        }
    }
}

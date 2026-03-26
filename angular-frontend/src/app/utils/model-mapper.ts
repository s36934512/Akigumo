import { DisplayPageItem } from '@models/display.types';
import { ComicFile, ComicFileDTO, PageItem, SortableComicFile } from '@models/comic.types';

export class DisplayModel {

    static fromPageItem(data: PageItem, serialNumber: number = 0): DisplayPageItem {
        return {
            serialNumber: serialNumber,
            url: data.url
        };
    }

    static fromPageItems(data: PageItem[]): DisplayPageItem[] {
        return data.map((item, index) => this.fromPageItem(item, index));
    }
}

export class ComicFileModel {

    // 把 API 回傳的 ComicFileDTO 轉換成前端使用的 ComicFile 模型
    static fromApiResponse(data: ComicFileDTO): ComicFile {
        return {
            id: data.comic_id,
            coverUrl: data.cover_path,
            pages: (data.imageFiles || []).map((img, idx) => ({
                id: idx,
                url: img.file_name,
                // thumbnail: `/api/thumbnail?src=${encodeURIComponent(img.file_name)}&width=360&height=480`,
                selected: false,
                width: img.width,
                height: img.height
            })),
            editInfo: {
                title: data.title,
                author: Array.isArray(data.author) ? data.author.join(', ') : data.author || '',
                group: data.group,
                type: data.type,
                language: data.language,
                series: data.series,
                category: data.category,
                characters: Array.isArray(data.characters) ? data.characters.join(', ') : data.characters || '',
                tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
                status: data.status,
                releaseDate: data.releaseDate,
                isPublic: data.isPublic,
                description: data.description,
                editorNote: data.editorNote,
                ai_generated: data.ai_generated
            }
        };
    }
}

export class SortableComicFileModel {
    // 把 ComicFilee 轉換成 SortableComicFileModel 模型
    static fromComicFile(data: ComicFile, serialNumber: number = 0): SortableComicFile {
        return {
            serialNumber: serialNumber,
            id: data.id,
            selected: false,
            coverUrl: data.coverUrl,
            pages: data.pages,
            editInfo: data.editInfo
        };
    }

    static fromComicFiles(data: ComicFile[]): SortableComicFile[] {
        return data.map((item, index) => this.fromComicFile(item, index));
    }
}
import { CommonModule } from '@angular/common';
import { Component, effect, signal } from '@angular/core';
import { IndexEntry } from '@core/services/index-sync.service';
import { ItemFileResolverService } from '@core/services/item-file-resolver.service';

import { ContentExplorerStore } from '../../+state/content-explorer.store';

@Component({
    selector: 'app-content-entity-gallery',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './content-entity-gallery.component.html',
    styles: [`
        @keyframes scan-y {
            from {
                top: -10%;
            }
            to {
                top: 110%;
            }
        }
    `]
})
export class ContentEntityGalleryComponent {
    hoveredIndex = signal<number | null>(null);

    constructor(public readonly store: ContentExplorerStore) { }

    setHovered(index: number | null): void {
        this.hoveredIndex.set(index);
    }

    trackByEntry(_: number, entry: IndexEntry): string {
        return entry.id;
    }

    getCoverUrl(entry: IndexEntry): string | undefined {
        // 優先使用後端 Index-Stream 補全的 coverUrl
        if (entry.coverUrl) {
            return entry.coverUrl;
        }
        return undefined; // 回退到 CSS 漸層
    }

    splitTitle(name: string): [string, string] {
        const normalized = name.trim().replace(/\s+/g, '_').toUpperCase();
        const [head, tail = ''] = normalized.split('_');
        return [head, tail];
    }

    toSubtitle(entry: IndexEntry): string {
        if (typeof entry.pages === 'number') return `PAGES_${entry.pages}`;
        if (typeof entry.count === 'number') return `ITEMS_${entry.count}`;
        return `ID_${entry.id.slice(0, 6).toUpperCase()}`;
    }

    bgGradient(type: string): string {
        switch (type) {
            case 'WORK':
                return 'bg-[linear-gradient(135deg,rgba(59,178,191,0.2),transparent)]';
            case 'SERIES':
                return 'bg-[linear-gradient(135deg,rgba(217,164,145,0.2),transparent)]';
            case 'COLLECTION':
                return 'bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent)]';
            case 'FILE_CONTAINER':
            default:
                return 'bg-[linear-gradient(135deg,rgba(96,96,99,0.35),transparent)]';
        }
    }

    iconPath(type: string): string {
        switch (type) {
            case 'WORK':
                return 'M7 7V6a5 5 0 0 1 10 0v1h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Zm2 0h6V6a3 3 0 1 0-6 0v1Zm0 8v3h6v-3H9Z';
            case 'SERIES':
                return 'M12 2 2 7l10 5 10-5-10-5Zm0 9L2 16l10 5 10-5-10-5Zm0 5L2 21l10 5 10-5-10-5Z';
            case 'COLLECTION':
                return 'M3 4h3v16H3V4Zm5-2h3v18H8V2Zm5 4h3v14h-3V6Zm5-3h3v17h-3V3Z';
            case 'FILE_CONTAINER':
            default:
                return 'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2h-2V9H5v8h6v2H5a2 2 0 0 1-2-2V7Zm15 6a3 3 0 0 0-3 3v1h-1v5h8v-5h-1v-1a3 3 0 0 0-3-3Zm-1 4v-1a1 1 0 1 1 2 0v1h-2Z';
        }
    }
}
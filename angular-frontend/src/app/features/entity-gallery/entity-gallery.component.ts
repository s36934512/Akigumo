// import { CommonModule } from '@angular/common';
// import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { IndexEntry, IndexSyncService } from '@core/services/index-sync.service';

// type EntityType = 'WORK' | 'SERIES' | 'COLLECTION' | 'FILE_CONTAINER';
// type IconType = 'briefcase' | 'layers' | 'library' | 'folder-lock';

// interface EntityItem {
//     type: EntityType;
//     title: string;
//     subtitle: string;
//     icon: IconType;
//     coverUrl?: string;
// }

// @Component({
//     selector: 'app-entity-gallery',
//     standalone: true,
//     imports: [CommonModule],
//     templateUrl: './entity-gallery.component.html',
//     styleUrl: './entity-gallery.component.scss'
// })
// export class EntityGalleryComponent {
//     @Input() showHeader = true;
//     @Input() showFooter = true;
//     @Input() compact = false;
//     @Input() autoConnect = true;

//     hoveredIndex: number | null = null;

//     private readonly destroyRef = inject(DestroyRef);

//     constructor(private readonly indexSync: IndexSyncService) { }

//     data: EntityItem[] = [
//         { type: 'WORK', title: 'NEURAL_UNIT', subtitle: 'INST_882', icon: 'briefcase' },
//         { type: 'SERIES', title: 'LINEAR_FLOW', subtitle: 'CH_LEN_12', icon: 'layers' },
//         { type: 'COLLECTION', title: 'ARCH_MATRX', subtitle: 'ITEMS_2.4K', icon: 'library' },
//         { type: 'FILE_CONTAINER', title: 'VAULT_CORE', subtitle: 'SEC_LV_09', icon: 'folder-lock' }
//     ];

//     async ngOnInit(): Promise<void> {
//         if (typeof window !== 'undefined' && this.autoConnect) {
//             try {
//                 await this.indexSync.bootstrapAndConnect(crypto.randomUUID());
//             } catch (err) {
//                 console.error('Failed to bootstrap entity gallery index', err);
//             }
//         }

//         this.indexSync.entries$
//             .pipe(takeUntilDestroyed(this.destroyRef))
//             .subscribe((entries) => {
//                 const mapped = this.mapEntries(entries);
//                 if (mapped.length > 0) {
//                     this.data = mapped;
//                 }
//             });
//     }

//     private mapEntries(entries: IndexEntry[]): EntityItem[] {
//         return entries.slice(0, 4).map((entry, index) => {
//             const coverUrl = entry.metadata['coverUrl'];
//             return {
//                 type: entry.type,
//                 title: this.toDisplayTitle(entry.name),
//                 subtitle: this.toSubtitle(entry),
//                 icon: this.iconByType(entry.type, index),
//                 coverUrl: typeof coverUrl === 'string' ? coverUrl : undefined,
//             };
//         });
//     }

//     private toDisplayTitle(name: string): string {
//         const normalized = name.trim().replace(/\s+/g, '_').toUpperCase();
//         return normalized || 'UNTITLED';
//     }

//     private toSubtitle(entry: IndexEntry): string {
//         if (typeof entry.pages === 'number') return `PAGES_${entry.pages}`;
//         if (typeof entry.count === 'number') return `ITEMS_${entry.count}`;
//         return `ID_${entry.id.slice(0, 6).toUpperCase()}`;
//     }

//     private iconByType(type: EntityType, fallbackIndex: number): IconType {
//         switch (type) {
//             case 'WORK':
//                 return 'briefcase';
//             case 'SERIES':
//                 return 'layers';
//             case 'COLLECTION':
//                 return 'library';
//             case 'FILE_CONTAINER':
//                 return 'folder-lock';
//             default:
//                 return ['briefcase', 'layers', 'library', 'folder-lock'][fallbackIndex % 4] as IconType;
//         }
//     }

//     setHovered(index: number | null): void {
//         this.hoveredIndex = index;
//     }

//     splitTitle(title: string): [string, string] {
//         const [head, tail = ''] = title.split('_');
//         return [head, tail];
//     }

//     bgGradient(type: EntityType): string {
//         switch (type) {
//             case 'WORK':
//                 return 'bg-[linear-gradient(135deg,rgba(59,178,191,0.2),transparent)]';
//             case 'SERIES':
//                 return 'bg-[linear-gradient(135deg,rgba(217,164,145,0.2),transparent)]';
//             case 'COLLECTION':
//                 return 'bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent)]';
//             case 'FILE_CONTAINER':
//             default:
//                 return 'bg-[linear-gradient(135deg,rgba(96,96,99,0.35),transparent)]';
//         }
//     }

//     iconPath(icon: IconType): string {
//         switch (icon) {
//             case 'briefcase':
//                 return 'M7 7V6a5 5 0 0 1 10 0v1h3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-3v1a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Zm2 0h6V6a3 3 0 1 0-6 0v1Zm0 8v3h6v-3H9Z';
//             case 'layers':
//                 return 'M12 2 2 7l10 5 10-5-10-5Zm0 9L2 16l10 5 10-5-10-5Zm0 5L2 21l10 5 10-5-10-5Z';
//             case 'library':
//                 return 'M3 4h3v16H3V4Zm5-2h3v18H8V2Zm5 4h3v14h-3V6Zm5-3h3v17h-3V3Z';
//             case 'folder-lock':
//             default:
//                 return 'M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2h-2V9H5v8h6v2H5a2 2 0 0 1-2-2V7Zm15 6a3 3 0 0 0-3 3v1h-1v5h8v-5h-1v-1a3 3 0 0 0-3-3Zm-1 4v-1a1 1 0 1 1 2 0v1h-2Z';
//         }
//     }
// }

// import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { Component, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
// import { IndexSyncService } from '@core/services/index-sync.service';
// import { UploadService } from '@core/services/upload.service';
// import { LayoutComponent } from '@features/shell/layout';
// import { UploadFile } from '@models/comic.types';
// import { SidebarComponent } from '@shared/sidebar/sidebar.component';
// import Uppy from '@uppy/core';
// import { ButtonModule } from 'primeng/button';
// import { PanelModule } from 'primeng/panel';


// // PrimeNG imports
// import { InputTextModule } from 'primeng/inputtext';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ToastModule } from 'primeng/toast';
// import { TextareaModule } from 'primeng/textarea';
// import { ImageModule } from 'primeng/image';
// import { ListboxModule } from 'primeng/listbox';
// import { TabsModule } from 'primeng/tabs';
// import { ComicUploadService, PreviewImage } from './comic-upload.service';
// import '@uppy/core/css/style.min.css';
// import '@uppy/dashboard/css/style.min.css';


// @Component({
//     selector: 'app-comic-upload',
//     standalone: true,
//     imports: [
//         CommonModule,
//         CdkDropList,
//         CdkDrag,
//         SidebarComponent,
//         LayoutComponent,
//         ButtonModule,
//         PanelModule,
//         InputTextModule,
//         CheckboxModule,
//         ToastModule,
//         TextareaModule,
//         ImageModule,
//         ListboxModule,
//         TabsModule,
//     ],
//     templateUrl: './comic-upload.html',
//     styleUrls: ['./comic-upload.scss'],
// })
// export class UploadComponent {
//     uppy: Uppy | null = null;
//     coverImage: PreviewImage | null = null;
//     sortAsc = true;
//     customSorted = false;
//     editModalVisible = false;

//     previewImages: PreviewImage[] = [];
//     dragOver = false;
//     selectedFile: UploadFile | undefined = undefined;
//     resultMsg = "";
//     bootstrapError = '';

//     // Controller: 注入 Model(Service)
//     constructor(
//         private cdr: ChangeDetectorRef,
//         public comicUploadService: ComicUploadService,
//         public uploadService: UploadService,
//         public indexSyncService: IndexSyncService,
//         @Inject(PLATFORM_ID) private platformId: Object,
//     ) { }

//     get indexEntries$() {
//         return this.indexSyncService.entries$;
//     }

//     get indexTotalCount$() {
//         return this.indexSyncService.totalCount$;
//     }

//     get indexVersion$() {
//         return this.indexSyncService.version$;
//     }

//     openEditModal(fileId: string) {
//         this.uploadService.setEditingId(fileId);
//     }

//     ngOnInit() {
//         if (isPlatformBrowser(this.platformId)) {
//             this.indexSyncService.bootstrapAndConnect(this.uploadService.currentNotifyUploadId)
//                 .catch((err) => {
//                     this.bootstrapError = err instanceof Error ? err.message : 'Index bootstrap failed';
//                     this.cdr.detectChanges();
//                 });

//             // Initialize Uppy through service
//             this.uppy = this.comicUploadService.initializeUppy('#uppy-dashboard');

//             this.uppy.on('file-added', (file) => {
//                 // Placeholder for file validation/preview logic
//             });

//             this.uppy.on('upload-progress', (file, progress) => {
//                 // Placeholder for progress update logic
//             });

//             this.uppy.on('complete', (result) => {
//                 this.resultMsg = `上傳成功，共 ${(result.successful ? result.successful.length : 0)} 檔案`;
//                 this.cdr.detectChanges();
//             });
//         }
//     }

//     // 讓使用者選擇其他封面
//     selectCover() {
//         if (!this.previewImages.length) return;
//         const idx = prompt('請輸入要作為封面的圖片編號（1~' + this.previewImages.length + '）', '1');
//         const n = Number(idx);
//         if (!isNaN(n) && n >= 1 && n <= this.previewImages.length) {
//             this.coverImage = this.previewImages[n - 1];
//         }
//     }

//     removeImage(idx: number) {
//         this.previewImages.splice(idx, 1);
//     }

//     toggleSortOrder() {
//         this.sortAsc = !this.sortAsc;
//         this.customSorted = false;
//         this.previewImages = [...this.previewImages].sort((a, b) => {
//             if (this.sortAsc) {
//                 return a.url > b.url ? 1 : -1;
//             } else {
//                 return a.url < b.url ? 1 : -1;
//             }
//         });
//     }

//     sortImagesAsc() {
//         this.previewImages = [...this.previewImages].sort((a, b) => (a.url > b.url ? 1 : -1));
//     }

//     sortImagesDesc() {
//         this.previewImages = [...this.previewImages].sort((a, b) => (a.url < b.url ? 1 : -1));
//     }

//     confirmOrder() {
//         const order = this.previewImages.map(img => img.id || img.filename || '');
//         alert('目前順序：\n' + order.join('\n'));
//     }

//     // Controller: 調用 Model(Service) 處理最終上傳
//     async onSubmit(event: Event) {
//         event.preventDefault();

//         const payload = {

//             imageOrder: this.previewImages.map(img => img.originalUrl || img.url),
//             coverPath: this.coverImage?.originalUrl || this.coverImage?.url || ''
//         };
//         const result = await this.comicUploadService.uploadComic(payload);
//         if (result.success) {
//             this.resultMsg = `上傳成功，共 ${result.page_count} 頁`;
//             // 清空表單與預覽

//             this.previewImages = [];
//             this.coverImage = null;
//             this.selectedFile = undefined;
//         } else {
//             this.resultMsg = '錯誤：' + (result.error || '未知錯誤');
//         }
//         this.cdr.detectChanges();
//     }

//     drop(event: CdkDragDrop<PreviewImage[]>) {
//         this.customSorted = true;
//         moveItemInArray(this.previewImages, event.previousIndex, event.currentIndex);
//         console.log(this.previewImages)
//     }
// }

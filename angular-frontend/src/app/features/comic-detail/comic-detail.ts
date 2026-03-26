import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LayoutComponent } from '@features/shell/layout';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { ComicEditComponent } from '@features/comic-edit/comic-edit';
import { UploadService } from '@core/services/upload.service';
import { INITIAL_UPLOAD_FILE } from '@models/comic.types';
import { CommunicationService } from './communication';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from './data-service';

import { PageGridComponent } from './components/page-grid/page-grid.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

import { ImageViewerComponent } from '@features/image-viewer/image-viewer';
import { ImageViewerDataService } from '@features/image-viewer/image-viewer.service';

@Component({
  selector: 'app-comic-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LayoutComponent,
    ButtonModule,
    DialogModule,
    ComicEditComponent,
    PageGridComponent,
    ToolbarComponent,
    ImageViewerComponent
  ],
  templateUrl: './comic-detail.html',
  styleUrls: ['./comic-detail.scss'],
  providers: [CommunicationService, DataService, ImageViewerDataService]
})
export class ComicDetailComponent {
  comic: any = null;
  loading = false;
  error = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    public uploadService: UploadService,
    public communicationService: CommunicationService,
    public dataService: DataService,
    public imageViewerDataService: ImageViewerDataService
  ) {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const comicId = params.get('id');
      console.log('Route param id:', comicId);
      if (comicId) {
        this.dataService.fetchComic(comicId);
      }
    });
  }

  encodeUrl(url: string): string {
    return encodeURIComponent(url);
  }
}

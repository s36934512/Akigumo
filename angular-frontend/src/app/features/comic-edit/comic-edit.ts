import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { LightboxModule, Lightbox } from '@jjmhalew/ngx-lightbox';
import { THEME } from '@shared/themes/theme';
import { InfoFormComponent } from './components/info-form/info-form.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { PageGridComponent } from './components/page-grid/page-grid.component';
import { LightboxComponent } from './components/lightbox/lightbox.component';
import { ComicEditDataService } from './comic-edit-data.service';

import { UploadService } from '@core/services/upload.service';

@Component({
  selector: 'app-comic-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InfoFormComponent,
    ToolbarComponent,
    PageGridComponent,
    LightboxComponent,
    ButtonModule,
    LightboxModule
  ],
  templateUrl: './comic-edit.html',
  styleUrl: './comic-edit.scss',
  providers: [ComicEditDataService]
})
export class ComicEditComponent {
  constructor(public comicEditData: ComicEditDataService, public uploadService: UploadService) {
    this.uploadService.editingId$.pipe(takeUntilDestroyed()).subscribe(id => {
      const file = id ? this.uploadService.getFileById(id) : null;
      this.comicEditData.setSelectedFile(file);
    });
  }

  showTip = false;
  theme = THEME;

  setCover() {
    const file = this.comicEditData.selectedFileValue;
    const page = this.comicEditData.focusedPageValue;
    if (!file || !file.pages || !page) return;

    this.uploadService.updateFile({
      ...file,
      previewUrl: page.thumbnail
    });
  }

  saveFileInfo() {
    this.uploadService.updateFile(this.comicEditData.selectedFileValue!);
    this.comicEditData.setDefaults();
  }
}

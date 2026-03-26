import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ViewerComponent } from './components/viewer/viewer.component';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [DecimalPipe, ToolbarComponent, ViewerComponent],
  templateUrl: './image-viewer.html',
})
export class ImageViewerComponent {
  constructor() {
  }
}

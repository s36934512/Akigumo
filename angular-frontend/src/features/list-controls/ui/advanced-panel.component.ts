import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from '@openng/optimus-ui/button';
import { TagModule } from '@openng/optimus-ui/tag';

import { ListControlsStore } from '../model/list-controls.store';

@Component({
  selector: 'list-controls-advanced-panel',
  templateUrl: './advanced-panel.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, ButtonModule, TagModule],
})
export class AdvancedPanelComponent {
  protected store = inject(ListControlsStore);
}

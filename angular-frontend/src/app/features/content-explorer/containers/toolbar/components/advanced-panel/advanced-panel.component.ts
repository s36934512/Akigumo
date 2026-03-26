import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { ToolbarStateService } from '../../toolbar-state.service';
import { IToolbarControls, TOOLBAR_CONTROLS } from '../../interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-advanced-panel',
    templateUrl: './advanced-panel.component.html',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule],
})
export class AdvancedPanelComponent {
    gridDensity = 0;
    maxGridDensity = 0;
    minGridDensity = 0;

    constructor(
        public stateService: ToolbarStateService,
        @Inject(TOOLBAR_CONTROLS) public provider: IToolbarControls,
    ) {
        provider.toolbarConfig$.pipe(takeUntilDestroyed()).subscribe(config => {
            this.maxGridDensity = config.maxGridDensity;
            this.minGridDensity = config.minGridDensity;
            this.gridDensity = config.gridDensity;
        });
    }

    changeDensity(delta: number) {
        const density = this.gridDensity + delta
        const newDensity = Math.min(this.maxGridDensity, Math.max(this.minGridDensity, density));

        this.provider.updateState({ gridDensity: newDensity });
    }

    get canIncrease() {
        return this.gridDensity < this.maxGridDensity;
    }

    get canDecrease() {
        return this.gridDensity > this.minGridDensity;
    }
}
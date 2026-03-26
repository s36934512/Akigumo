import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';

import { ToolbarStateService } from '../../toolbar-state.service';
import { IToolbarControls, TOOLBAR_CONTROLS } from '../../interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-pagination-control',
    templateUrl: './pagination-control.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule],
})
export class PaginationControlComponent {
    currentPage = 0;
    totalPages = 0;

    constructor(
        public stateService: ToolbarStateService,
        @Inject(TOOLBAR_CONTROLS) public provider: IToolbarControls,
    ) {
        provider.toolbarConfig$.pipe(takeUntilDestroyed()).subscribe(config => {
            if (config.totalPages > 0) {
                this.currentPage = config.pageOffset + 1;
                this.totalPages = config.totalPages;
            }
        });
    }

    toPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.provider.updateState({ pageOffset: page - 1 });
        }
    }

    get canPrevPage() {
        return this.currentPage > 1;
    }

    get canNextPage() {
        return this.currentPage < this.totalPages;
    }
}
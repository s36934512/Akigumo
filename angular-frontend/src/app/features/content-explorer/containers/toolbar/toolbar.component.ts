import { AsyncPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { UploadService } from '@core/services/upload.service';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectChangeEvent, SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { AdvancedPanelComponent } from './components/advanced-panel/advanced-panel.component';
import { PaginationControlComponent } from './components/pagination-control/pagination-control.component';
import { IToolbarControls, TOOLBAR_CONTROLS, SORT_OPTIONS } from './interface';
import { ToolbarStateService } from './toolbar-state.service';



@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    standalone: true,
    imports: [
        ButtonModule,
        SelectModule,
        FormsModule,
        AsyncPipe,
        InputTextModule,
        InputGroupModule,
        InputGroupAddonModule,
        ToolbarModule,
        TooltipModule,
        AdvancedPanelComponent,
        PaginationControlComponent
    ],
    providers: [ToolbarStateService]
})
export class ToolbarComponent {
    sortState = 'asc';
    sortOptions = SORT_OPTIONS;
    selectedSortIndex = 0;
    sortIcon = 'pi-arrow-up';
    searchValue = '';

    constructor(
        @Inject(TOOLBAR_CONTROLS) public provider: IToolbarControls,
        public stateService: ToolbarStateService,
        private uploadService: UploadService
    ) {
        this.provider.toolbarConfig$.pipe(takeUntilDestroyed()).subscribe(config => {
            this.sortState = config.sortState;
            this.selectedSortIndex = config.selectedSortIndex;
            this.sortIcon = config.sortState === 'asc' ? 'pi-arrow-up' : 'pi-arrow-down';
            this.searchValue = config.searchQuery;
        });
    }

    toggleSort() {
        this.provider.updateState({
            sortState: this.sortState === 'asc' ? 'desc' : 'asc'
        });
    }

    onSortChange(event: SelectChangeEvent) {
        this.provider.updateState({
            selectedSortIndex: this.sortOptions.findIndex(o => o.code === event.value.code)
        });
    }

    onSearchChange(query: string) {
        this.provider.updateState({
            searchQuery: query
        });
    }

    onFolderSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        this.uploadService.addFilesFromFolderInput(input.files);
        // Reset so the same folder can be re-selected
        input.value = '';
    }
}

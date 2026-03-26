import { Component, Input } from '@angular/core';
import { NgClass, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { IftaLabelModule } from 'primeng/iftalabel';

import { ComicEditDataService } from '../../comic-edit-data.service';

@Component({
    selector: 'app-info-form',
    templateUrl: './info-form.component.html',
    standalone: true,
    imports: [FormsModule, NgClass, CheckboxModule, InputTextModule, IftaLabelModule, AsyncPipe]
})
export class InfoFormComponent {
    @Input() fieldClass: string | undefined;

    constructor(public comicEditData: ComicEditDataService) { }

    updateField(key: string, value: any) {
        this.comicEditData.updateEditInfo({ [key]: value });
    }
}
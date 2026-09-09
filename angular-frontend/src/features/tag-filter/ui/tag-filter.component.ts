import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface TagCount {
  tag: string;
  count: number;
}

@Component({
  selector: 'feature-tag-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tag-filter.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./tag-filter.component.scss'],
})
export class TagFilterComponent {
  @Input() allTags: TagCount[] = [];
  @Input() selectedTags: string[] = [];
  @Output() toggleTag = new EventEmitter<string>();
  @Output() clearTags = new EventEmitter<void>();

  filterKeyword = '';

  get filteredTags() {
    const keyword = this.filterKeyword.trim().toLowerCase();
    if (!keyword) {
      return this.allTags;
    }
    return this.allTags.filter((item) => item.tag.toLowerCase().includes(keyword));
  }

  onToggle(tag: string) {
    this.toggleTag.emit(tag);
  }

  onClear() {
    this.clearTags.emit();
  }
}

import { Component, Input } from '@angular/core';

export interface TreeNode {
    name: string;
    size: number;
    children?: TreeNode[];
}

@Component({
    selector: 'app-tree-size',
    standalone: true,
    templateUrl: './tree-size.html',
    styleUrls: ['./tree-size.scss']
})
export class TreeSizeComponent {
    @Input() tree: TreeNode[] = [];

    formatSize(size: number): string {
        if (size > 1024 * 1024 * 1024) return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        if (size > 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
        if (size > 1024) return (size / 1024).toFixed(2) + ' KB';
        return size + ' B';
    }
}

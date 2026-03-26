import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { THEME } from '@shared/themes/theme';
import { NavItem, MENU } from './router.types';

@Injectable()
export class LayoutDataService {
    private _isSidebarCollapsed = new BehaviorSubject<boolean>(false);
    private _isPinned = new BehaviorSubject<boolean>(true);
    private _activeItem = new BehaviorSubject<NavItem | null>(null);

    readonly isSidebarCollapsed$ = this._isSidebarCollapsed.asObservable();
    readonly isPinned$ = this._isPinned.asObservable();
    readonly activeItem$ = this._activeItem.asObservable();

    readonly theme = THEME;
    readonly menuItems = MENU;

    get isPinnedValue() {
        return this._isPinned.getValue();
    }

    setPinned(value: boolean) {
        this._isPinned.next(value);
    }

    get activeItemValue() {
        return this._activeItem.getValue();
    }

    setActiveItem(item: any) {
        this._activeItem.next(item);
    }

    get isSidebarCollapsedValue() {
        return this._isSidebarCollapsed.getValue();
    }

    getToggleBtnLeft() {
        const map = [
            ['256px', '0'],
            ['256px', '80px']
        ];
        return map[+this.isPinnedValue][+this.isSidebarCollapsedValue];
    }

    toggleSidebar() {
        this._isSidebarCollapsed.next(!this._isSidebarCollapsed.getValue());
    }

    togglePin() {
        this._isPinned.next(!this._isPinned.getValue());
        if (!this.isPinnedValue) {
            this._isSidebarCollapsed.next(true);
        }
    }
}
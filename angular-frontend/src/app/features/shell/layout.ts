import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { LayoutDataService } from './layout-data.service';
import { LogoComponent } from './components/logo/logo.component';
import { UserComponent } from './components/user/user.component';
import { NavComponent } from './components/nav/nav.component';
import { MusicPlayerComponent } from '../music-player/music-player';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.html',
    styleUrl: './layout.scss',
    standalone: true,
    imports: [CommonModule, ButtonModule, LogoComponent, UserComponent, NavComponent, MusicPlayerComponent],
    providers: [LayoutDataService]
})
export class LayoutComponent {
    constructor(public layoutDataService: LayoutDataService) { }
}

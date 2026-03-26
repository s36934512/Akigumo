import { Routes } from '@angular/router';

import { TestComponent } from './shared/test/test.component';

export const routes: Routes = [
    { path: '', redirectTo: 'content-explorer', pathMatch: 'full' },
    // {
    //     path: 'entity-gallery',
    //     loadComponent: () => import('./features/entity-gallery/entity-gallery.page').then(m => m.EntityGalleryPage)
    // },
    { path: 'test', component: TestComponent },
    {
        path: 'content-explorer',
        loadComponent: () => import('./features/content-explorer/content-explorer.page').then(m => m.ContentExplorerPage)
    },
    {
        // Legacy redirect: keep accessible during migration
        path: 'main',
        redirectTo: 'content-explorer',
        pathMatch: 'full'
    },
    {
        path: 'trash',
        loadComponent: () => import('./features/trash/trash').then(m => m.TrashComponent)
    },
    // {
    //     path: 'upload',
    //     loadComponent: () => import('./features/upload/upload').then(m => m.UploadComponent)
    // },
    {
        path: 'comic-detail/:id',
        loadComponent: () => import('./features/comic-detail/comic-detail').then(m => m.ComicDetailComponent)
    },
    {
        path: 'cabinet',
        loadComponent: () => import('./features/file-manager/file-manager').then(m => m.FileManagerComponent)
    },
    // Placeholder routes for nav items not yet implemented
    { path: 'unsorted', redirectTo: 'content-explorer', pathMatch: 'full' },
    { path: 'statistics', redirectTo: 'content-explorer', pathMatch: 'full' },
    { path: 'settings', redirectTo: 'content-explorer', pathMatch: 'full' },
];

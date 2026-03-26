import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map } from 'rxjs';

import { SortableComicFile, INITIAL_SORTABLE_COMIC_FILE, ComicFileDTO } from '@models/comic.types';
import { ComicFileModel, SortableComicFileModel } from '@utils/model-mapper';
import { ComicFileItemControllerService } from './comic-file-item-controller.service';

@Injectable()
export class ComicFileItemViewmodelService {
    layout$;
    selected$;

    constructor(private controllerService: ComicFileItemControllerService) {
        this.layout$ = this.controllerService.comicFile$.pipe(
            filter(
                (comic) => !!(comic)
            ),
            map(comic => {
                return {
                    totalPages: comic.imageFiles.length,
                    url: comic.cover_path
                }
            })
        );

        this.selected$ = this.controllerService.selected$;
    }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ComicFileDTO } from '@models/comic.types';

@Injectable()
export class ComicFileItemControllerService {
    private _comicFile = new BehaviorSubject<ComicFileDTO | null>(null);
    private _selected = new BehaviorSubject<boolean>(false);

    setComicFile(comicFile: ComicFileDTO) {
        this._comicFile.next(comicFile);
    }

    setSelected(selected: boolean) {
        this._selected.next(selected);
    }

    get comicFile$() {
        return this._comicFile.asObservable();
    }

    get selected$() {
        return this._selected.asObservable();
    }

    get currentComicFile(): ComicFileDTO | null {
        return this._comicFile.getValue();
    }
}
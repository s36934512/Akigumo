import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FileManagerComponent } from './file-manager';

describe('FileManagerComponent', () => {
    let httpMock: HttpTestingController;
    let component: FileManagerComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FileManagerComponent]
        });
        httpMock = TestBed.inject(HttpTestingController);
        component = TestBed.inject(FileManagerComponent);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // 你可以在這裡加更多測試
});

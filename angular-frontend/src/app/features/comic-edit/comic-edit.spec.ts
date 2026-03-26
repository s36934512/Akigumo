import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComicEditComponent } from './comic-edit';
import { FormsModule } from '@angular/forms';

describe('ComicEditComponent', () => {
    let component: ComicEditComponent;
    let fixture: ComponentFixture<ComicEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, ComicEditComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ComicEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // 你可以在這裡加更多測試
});

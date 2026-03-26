import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComicDetailComponent } from './comic-detail';

describe('ComicDetail', () => {
  let component: ComicDetailComponent;
  let fixture: ComponentFixture<ComicDetailComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComicDetailComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ComicDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

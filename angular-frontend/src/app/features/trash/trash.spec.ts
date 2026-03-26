import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrashComponent } from './trash';

describe('Trash', () => {
  let component: TrashComponent;
  let fixture: ComponentFixture<TrashComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrashComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrashComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewNotes } from './preview-notes';

describe('PreviewNotes', () => {
  let component: PreviewNotes;
  let fixture: ComponentFixture<PreviewNotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewNotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewNotes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

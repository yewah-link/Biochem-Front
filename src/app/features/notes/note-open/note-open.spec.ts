import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteOpen } from './note-open';

describe('NoteOpen', () => {
  let component: NoteOpen;
  let fixture: ComponentFixture<NoteOpen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteOpen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteOpen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

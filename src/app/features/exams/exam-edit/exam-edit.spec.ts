import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamEdit } from './exam-edit';

describe('ExamEdit', () => {
  let component: ExamEdit;
  let fixture: ComponentFixture<ExamEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

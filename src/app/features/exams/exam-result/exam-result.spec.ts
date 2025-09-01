import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamResult } from './exam-result';

describe('ExamResult', () => {
  let component: ExamResult;
  let fixture: ComponentFixture<ExamResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamResult);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentCourseView } from './student-course-view';

describe('StudentCourseView', () => {
  let component: StudentCourseView;
  let fixture: ComponentFixture<StudentCourseView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentCourseView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentCourseView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

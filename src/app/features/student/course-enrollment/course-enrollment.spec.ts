import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseEnrollment } from './course-enrollment';

describe('CourseEnrollment', () => {
  let component: CourseEnrollment;
  let fixture: ComponentFixture<CourseEnrollment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseEnrollment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseEnrollment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

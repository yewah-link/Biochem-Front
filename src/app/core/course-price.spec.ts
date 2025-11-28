import { TestBed } from '@angular/core/testing';
import { CoursePriceService } from './course-price.service';


describe('CoursePrice', () => {
  let service: CoursePriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoursePriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

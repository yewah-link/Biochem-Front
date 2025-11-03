import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Learning } from './learning';
describe('ContinueLearaning', () => {
  let component: Learning;
  let fixture: ComponentFixture<Learning>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Learning]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Learning);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

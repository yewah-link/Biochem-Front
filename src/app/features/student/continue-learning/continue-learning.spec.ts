import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinueLearning } from './continue-learning';

describe('ContinueLearaning', () => {
  let component: ContinueLearning;
  let fixture: ComponentFixture<ContinueLearning>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinueLearning]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContinueLearning);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

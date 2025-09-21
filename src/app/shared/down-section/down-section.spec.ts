import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownSection } from './down-section';

describe('DownSection', () => {
  let component: DownSection;
  let fixture: ComponentFixture<DownSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewVideos } from './preview-videos';

describe('PreviewVideos', () => {
  let component: PreviewVideos;
  let fixture: ComponentFixture<PreviewVideos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewVideos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewVideos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

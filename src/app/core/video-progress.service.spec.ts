import { TestBed } from '@angular/core/testing';

import { VideoProgressService } from './video-progress.service';

describe('VideoProgressService', () => {
  let service: VideoProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoProgressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

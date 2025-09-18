import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryDto, CategoryService } from '../../core/category.service';
import { VideoDto, VideoService } from '../../core/video.service';
import { Observable, BehaviorSubject, forkJoin, map, catchError, of } from 'rxjs';

// Extended VideoDto interface to track thumbnail states
interface ExtendedVideoDto extends VideoDto {
  thumbnailFailed?: boolean;
  thumbnailLoaded?: boolean;
  showPlaceholder?: boolean;
  thumbnailUrl?: string;
  streamUrl?: string;
}

interface CategoryWithVideos {
  category: CategoryDto;
  videos: ExtendedVideoDto[];
}

@Component({
  selector: 'app-video-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-preview.html',
  styleUrls: ['./video-preview.scss']
})
export class VideoPreview implements OnInit {
  private categoriesWithVideosSubject = new BehaviorSubject<CategoryWithVideos[]>([]);
  categoriesWithVideos$: Observable<CategoryWithVideos[]> = this.categoriesWithVideosSubject.asObservable();

  constructor(
    private videoService: VideoService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.categoryService.getAll().subscribe({
      next: (response) => {
        if (response.status === 'SUCCESS' && response._embedded) {
          const categories = response._embedded;
          this.loadVideosForCategories(categories);
        } else {
          console.error('Failed to load categories:', response.message);
          this.categoriesWithVideosSubject.next([]);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categoriesWithVideosSubject.next([]);
      }
    });
  }

  private loadVideosForCategories(categories: CategoryDto[]): void {
    if (categories.length > 0) {
      const categoryVideoRequests = categories.map((category: CategoryDto) =>
        this.videoService.getVideosByCategory(category.id!).pipe(
          map((videos: VideoDto[]) => ({
            category: category,
            videos: videos.map(video => this.initializeExtendedVideo(video))
          })),
          catchError(error => {
            console.error(`Error loading videos for category ${category.id}:`, error);
            return of({
              category: category,
              videos: []
            });
          })
        )
      );

      forkJoin(categoryVideoRequests).subscribe({
        next: (categoriesWithVideos: CategoryWithVideos[]) => {
          this.categoriesWithVideosSubject.next(categoriesWithVideos);
          this.preloadThumbnails(categoriesWithVideos);
        },
        error: (error) => {
          console.error('Error loading videos:', error);
          this.categoriesWithVideosSubject.next([]);
        }
      });
    } else {
      this.categoriesWithVideosSubject.next([]);
    }
  }

  private initializeExtendedVideo(video: VideoDto): ExtendedVideoDto {
    const extendedVideo: ExtendedVideoDto = {
      ...video,
      thumbnailFailed: false,
      thumbnailLoaded: false,
      showPlaceholder: false
    };

    if (this.videoService.isValidVideoId(video)) {
      extendedVideo.thumbnailUrl = this.videoService.getVideoThumbnail(video);
      extendedVideo.streamUrl = this.videoService.getVideoStreamUrl(video);
    } else {
      extendedVideo.showPlaceholder = true;
    }

    return extendedVideo;
  }

  private preloadThumbnails(categoriesWithVideos: CategoryWithVideos[]): void {
    categoriesWithVideos.forEach(categoryData => {
      categoryData.videos.forEach(video => {
        if (video.id && !video.thumbnailFailed) {
          this.videoService.getVideoThumbnailBlob(video.id).subscribe({
            next: (blob) => {
              if (blob) {
                video.thumbnailLoaded = true;
              } else {
                this.handleThumbnailFailure(video);
              }
              this.cdr.detectChanges();
            },
            error: () => {
              this.handleThumbnailFailure(video);
              this.cdr.detectChanges();
            }
          });
        }
      });
    });
  }

  private handleThumbnailFailure(video: ExtendedVideoDto): void {
    video.thumbnailFailed = true;
    video.thumbnailLoaded = false;
    video.showPlaceholder = true;
    console.log('Using placeholder for video:', video.id);
  }

  getVideoThumbnail(video: ExtendedVideoDto): string {
    return video.thumbnailUrl || this.videoService.getFallbackThumbnailUrl();
  }

  onThumbnailError(event: Event, video: ExtendedVideoDto): void {
    console.error('Thumbnail failed to load for video:', video.id);
    this.handleThumbnailFailure(video);
  }

  onThumbnailLoad(event: Event, video: ExtendedVideoDto): void {
    video.thumbnailLoaded = true;
    video.thumbnailFailed = false;
    console.log('Thumbnail loaded successfully for video:', video.id);
  }

  trackByVideoId(index: number, video: VideoDto): number | undefined {
    return video.id;
  }

  trackByCategoryId(index: number, categoryData: CategoryWithVideos): number | undefined {
    return categoryData.category.id;
  }

  openVideo(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/video', id]);
    }
  }

  // Added missing viewAllVideos method
  viewAllVideos(categoryId: number | undefined): void {
    if (categoryId) {
      this.router.navigate(['/category', categoryId]);
      console.log('View all videos for category:', categoryId);
    }
  }

  shouldShowThumbnail(video: ExtendedVideoDto): boolean {
    return !!video.thumbnailUrl && !video.thumbnailFailed && !video.showPlaceholder;
  }

  shouldShowPlaceholder(video: ExtendedVideoDto): boolean {
    return !!video.showPlaceholder || (!video.thumbnailUrl);
  }

  getFallbackImageUrl(): string {
    return this.videoService.getFallbackThumbnailUrl();
  }
}

import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
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
  @ViewChild('videosContainer') videosContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('tabsContainer') tabsContainer!: ElementRef<HTMLDivElement>;

  private categoriesWithVideosSubject = new BehaviorSubject<CategoryWithVideos[]>([]);
  categoriesWithVideos$: Observable<CategoryWithVideos[]> = this.categoriesWithVideosSubject.asObservable();

  selectedCategoryId: number | undefined;
  canScrollLeft = false;
  canScrollRight = false;

  // Underline animation state
  activeUnderlineWidth = 0;
  activeUnderlineLeft = 0;

  constructor(
    private videoService: VideoService,
    private categoryService: CategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateUnderlinePosition();
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
      // Set first category as selected by default
      this.selectedCategoryId = categories[0].id;

      const categoryVideoRequests = categories.map((category: CategoryDto) =>
        // FIX: Using the new 'getVideosByCourse' method
        this.videoService.getVideosByCourse(category.id!).pipe( 
          map((videos: VideoDto[]) => ({
            category: category,
            videos: videos.map((video) => this.initializeExtendedVideo(video))
          })),
          catchError((error) => {
            console.error(`Error loading videos for course ${category.id}:`, error);
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
          setTimeout(() => {
            this.checkScroll();
            this.initUnderlinePosition();
          }, 100);
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

  // Initialize underline under the first tab
  private initUnderlinePosition(): void {
    if (!this.tabsContainer || !this.selectedCategoryId) return;
    const buttons = Array.from(this.tabsContainer.nativeElement.querySelectorAll('button'));
    const categoryName = this.getCategoryNameById(this.selectedCategoryId);
    if (!categoryName) return;
    const activeButton = buttons.find((btn) =>
      btn.textContent?.trim()
        .toLowerCase()
        .includes(categoryName.toLowerCase())
    );
    if (activeButton) this.moveUnderline(activeButton as HTMLElement);
  }

  selectCategory(categoryId: number, index?: number, tabButton?: HTMLElement): void {
    this.selectedCategoryId = categoryId;

    if (tabButton) {
      this.moveUnderline(tabButton);
    }

    // Reset scroll position and check scroll arrows
    setTimeout(() => {
      if (this.videosContainer) {
        this.videosContainer.nativeElement.scrollLeft = 0;
        this.checkScroll();
      }
    }, 0);
  }

  // Move underline smoothly
  private moveUnderline(tabButton: HTMLElement): void {
    const container = this.tabsContainer.nativeElement;
    const containerRect = container.getBoundingClientRect();
    const rect = tabButton.getBoundingClientRect();

    this.activeUnderlineWidth = rect.width;
    this.activeUnderlineLeft = rect.left - containerRect.left + container.scrollLeft;
    this.cdr.detectChanges();
  }

  // Update underline when layout changes
  private updateUnderlinePosition(): void {
    if (!this.tabsContainer || !this.selectedCategoryId) return;
    const buttons = Array.from(this.tabsContainer.nativeElement.querySelectorAll('button'));
    const activeButton = buttons.find((btn) =>
      btn.classList.contains('text-[#9b6012]')
    );
    if (activeButton) this.moveUnderline(activeButton as HTMLElement);
  }

  scrollLeft(): void {
    if (this.videosContainer) {
      const container = this.videosContainer.nativeElement;
      container.scrollBy({ left: -600, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    if (this.videosContainer) {
      const container = this.videosContainer.nativeElement;
      container.scrollBy({ left: 600, behavior: 'smooth' });
    }
  }

  onScroll(event?: Event): void {
    this.checkScroll();
  }

  private checkScroll(): void {
    if (this.videosContainer) {
      const container = this.videosContainer.nativeElement;
      this.canScrollLeft = container.scrollLeft > 0;
      this.canScrollRight =
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1;
      this.cdr.detectChanges();
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
    categoriesWithVideos.forEach((categoryData) => {
      categoryData.videos.forEach((video) => {
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
  }

  getVideoThumbnail(video: ExtendedVideoDto): string {
    return video.thumbnailUrl || this.videoService.getFallbackThumbnailUrl();
  }

  onThumbnailError(_: Event, video: ExtendedVideoDto): void {
    this.handleThumbnailFailure(video);
  }

  trackByVideoId(_: number, video: VideoDto): number | undefined {
    return video.id;
  }

  trackByCategoryId(_: number, categoryData: CategoryWithVideos): number | undefined {
    return categoryData.category.id;
  }

  openVideo(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/video', id]);
    }
  }

  viewAllVideos(categoryId: number | undefined): void {
    if (categoryId) {
      this.router.navigate(['/category', categoryId]);
    }
  }

  shouldShowThumbnail(video: ExtendedVideoDto): boolean {
    return !!video.thumbnailUrl && !video.thumbnailFailed && !video.showPlaceholder;
  }

  shouldShowPlaceholder(video: ExtendedVideoDto): boolean {
    return !!video.showPlaceholder || !video.thumbnailUrl;
  }

  getFallbackImageUrl(): string {
    return this.videoService.getFallbackThumbnailUrl();
  }

  // Helper for category name lookup
  private getCategoryNameById(categoryId: number | undefined): string | null {
    if (!categoryId) return null;
    const categories = this.categoriesWithVideosSubject.value;
    const found = categories.find((c) => c.category.id === categoryId);
    return found ? found.category.name : null;
  }
}
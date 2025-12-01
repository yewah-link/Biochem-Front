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
import { CourseDto, CourseService } from '../../core/course.service';
import { Observable, BehaviorSubject, map } from 'rxjs';

// Extended CourseDto interface to track thumbnail states
interface ExtendedCourseDto extends CourseDto {
  thumbnailFailed?: boolean;
  thumbnailLoaded?: boolean;
  showPlaceholder?: boolean;
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

  private coursesSubject = new BehaviorSubject<ExtendedCourseDto[]>([]);
  courses$: Observable<ExtendedCourseDto[]> = this.coursesSubject.asObservable();

  canScrollLeft = false;
  canScrollRight = false;

  constructor(
    private courseService: CourseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScroll();
  }

  private loadCourses(): void {
    this.courseService.getAllCourses().subscribe({
      next: (courses: CourseDto[]) => {
        const extendedCourses = courses.map(course => this.initializeExtendedCourse(course));
        this.coursesSubject.next(extendedCourses);
        this.preloadThumbnails(extendedCourses);
        setTimeout(() => {
          this.checkScroll();
        }, 100);
      },
      error: (error) => {
        this.coursesSubject.next([]);
      }
    });
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

  private initializeExtendedCourse(course: CourseDto): ExtendedCourseDto {
    const extendedCourse: ExtendedCourseDto = {
      ...course,
      thumbnailFailed: false,
      thumbnailLoaded: false,
      showPlaceholder: !course.thumbnailUrl
    };

    return extendedCourse;
  }

  private preloadThumbnails(courses: ExtendedCourseDto[]): void {
    courses.forEach((course) => {
      if (course.thumbnailUrl && !course.thumbnailFailed) {
        // Preload thumbnail image
        const img = new Image();
        img.onload = () => {
          course.thumbnailLoaded = true;
          this.cdr.detectChanges();
        };
        img.onerror = () => {
          this.handleThumbnailFailure(course);
          this.cdr.detectChanges();
        };
        img.src = course.thumbnailUrl;
      }
    });
  }

  private handleThumbnailFailure(course: ExtendedCourseDto): void {
    course.thumbnailFailed = true;
    course.thumbnailLoaded = false;
    course.showPlaceholder = true;
  }

  getVideoThumbnail(course: ExtendedCourseDto): string {
    return this.courseService.getCourseThumbnailUrl(course) || this.getFallbackImageUrl();
  }

  onThumbnailError(_: Event, course: ExtendedCourseDto): void {
    this.handleThumbnailFailure(course);
  }

  trackByVideoId(_: number, course: CourseDto): number | undefined {
    return course.id;
  }

  openVideo(id: number | undefined): void {
    if (id) {
      // Navigate to course detail page
      this.router.navigate(['/dashboard/courses', id]);
    }
  }

  shouldShowThumbnail(course: ExtendedCourseDto): boolean {
    return !!course.thumbnailUrl && !course.thumbnailFailed && !course.showPlaceholder;
  }

  shouldShowPlaceholder(course: ExtendedCourseDto): boolean {
    return !!course.showPlaceholder || !course.thumbnailUrl;
  }

  getFallbackImageUrl(): string {
    return 'assets/images/course-placeholder.png';
  }

  getCourseImage(course: CourseDto): string {
    // Try thumbnailUrl first, then fallback to a data URI placeholder
    if ((course as any).thumbnailUrl) {
      return this.courseService.getCourseThumbnailUrl(course);
    }

    // Return a data URI SVG placeholder as fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzliNjAxMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db3Vyc2UgSW1hZ2U8L3RleHQ+PC9zdmc+';
  }

  enrollInCourse(course: CourseDto): void {
    // Stop event propagation to prevent triggering openVideo
    event?.stopPropagation();
    
    if (course.id) {
      // Navigate to enrollment page or handle enrollment logic
      this.router.navigate(['/dashboard/courses', course.id, 'enroll']);
      
      // Alternative: You could also call an enrollment service here
      // this.courseService.enrollInCourse(course.id).subscribe({
      //   next: () => {
      //     // Show success message or navigate
      //   },
      //   error: (error) => {
      //     // Handle enrollment error
      //   }
      // });
    }
  }
}
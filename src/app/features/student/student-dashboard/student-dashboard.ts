import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CourseDto, CourseService, CategoryDto } from '../../../core/course.service';
import { AuthService, UserDto } from '../../../core/auth/auth.service';
import { CoursePriceDto } from '../../../core/course-price.service';
import { Subscription } from 'rxjs';
import { MyCourses } from '../my-courses/my-courses';
import { Footer } from '../../../shared/footer/footer';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MyCourses,
    Footer
  ],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss'
})
export class StudentDashboard implements OnInit, OnDestroy {
  mobileSearchActive = false;
  mobileMenuOpen = false;
  userMenuOpen = false;
  isLoggedIn = false;
  userName = 'User';
  userInitials = 'U';
  currentUser: UserDto | null = null;
  private userSubscription?: Subscription;

  courses: CourseDto[] = [];
  filteredCourses: CourseDto[] = [];
  categories: CategoryDto[] = [];
  selectedCategoryId: number | null = null;

  // Track enrolled course IDs and their categories
  enrolledCourseIds: number[] = [];
  enrolledCategoryIds: number[] = [];

  // Track liked courses
  likedCourseIds: Set<number> = new Set();

  // Track loading states
  private coursesLoaded = false;
  private enrollmentsLoaded = false;

  // Countdown intervals
  private countdownIntervals = new Map<number, any>();

  constructor(
    public courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCourses();
    this.loadLikedCourses();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    
    // Clear all countdown intervals
    this.countdownIntervals.forEach(interval => clearInterval(interval));
    this.countdownIntervals.clear();
  }

  loadUserData(): void {
    this.userSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          this.isLoggedIn = true;
          this.userName = this.getUserDisplayName(user);
          this.userInitials = this.getUserInitials(user);
        } else {
          this.isLoggedIn = false;
          this.userName = 'User';
          this.userInitials = 'U';
        }
      }
    });

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  getUserDisplayName(user: UserDto): string {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  }

  getUserInitials(user: UserDto): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  loadCourses(): void {
    this.courseService.getPublishedCourses().subscribe({
      next: (coursesData: CourseDto[]) => {
        this.courses = coursesData;
        this.filteredCourses = coursesData;
        this.extractCategories();
        this.coursesLoaded = true;

        // Load pricing for each course
        this.courses.forEach(course => {
          if (course.id) {
            this.courseService.coursePriceService.getCoursePricing(course.id).subscribe({
              next: (pricing) => {
                // Attach pricing to course object
                (course as any).coursePrice = pricing;
                
                // Start countdown if has future pricing
                if (this.courseService.coursePriceService.willBecomePaid(pricing)) {
                  this.startCountdown(course.id!);
                }
              },
              error: (err) => {
                console.error('Failed to load pricing for course:', course.id);
              }
            });
          }
        });

        // Update recommendations if enrollments already loaded
        if (this.enrollmentsLoaded) {
          this.getRecommendedCourses();
        }
      },
      error: (err: any) => {
        console.error('Failed to load courses:', err);
        this.coursesLoaded = true;
      }
    });
  }

  extractCategories(): void {
    const categoryMap = new Map<number, CategoryDto>();

    this.courses.forEach(course => {
      if (course.category && course.category.id) {
        categoryMap.set(course.category.id, course.category);
      }
    });

    this.categories = Array.from(categoryMap.values());
  }

  filterByCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;

    if (categoryId === null) {
      this.filteredCourses = this.courses;
    } else {
      this.filteredCourses = this.courses.filter(
        course => course.category?.id === categoryId
      );
    }
  }

  isCategorySelected(categoryId: number | null): boolean {
    return this.selectedCategoryId === categoryId;
  }

  // Handler for enrolled course IDs from my-courses component
  onEnrolledCoursesLoaded(courseIds: number[]): void {
    this.enrolledCourseIds = courseIds;
    this.enrollmentsLoaded = true;

    // Determine the categories of the enrolled courses
    const categoryIds = this.courses
      .filter(course => course.id && courseIds.includes(course.id))
      .map(course => course.category?.id)
      .filter((id): id is number => id !== undefined);

    // Remove duplicates
    this.enrolledCategoryIds = [...new Set(categoryIds)];
  }

  // Get recommended courses (ONLY courses the user is NOT enrolled in)
  getRecommendedCourses(): CourseDto[] {
    // If courses not loaded yet, return empty array
    if (!this.coursesLoaded) {
      return [];
    }

    // Filter out all enrolled courses
    const notEnrolledCourses = this.courses.filter(course => {
      if (!course.id) {
        return false;
      }
      return !this.enrolledCourseIds.includes(course.id);
    });

    // If no courses available (user enrolled in all), return empty array
    if (notEnrolledCourses.length === 0) {
      return [];
    }

    // If user has enrolled in courses with specific categories, prioritize similar courses
    if (this.enrolledCategoryIds.length > 0) {
      // Courses in the same categories as enrolled courses
      const sameCategoryCourses = notEnrolledCourses.filter(course =>
        course.category?.id && this.enrolledCategoryIds.includes(course.category.id)
      );

      // Other courses
      const otherCourses = notEnrolledCourses.filter(course =>
        !course.category?.id || !this.enrolledCategoryIds.includes(course.category.id)
      );

      // Combine: prioritize same category, then others, limit to 4
      return [...sameCategoryCourses, ...otherCourses].slice(0, 4);
    }

    // If no enrolled courses yet, just return first 4 available courses
    return notEnrolledCourses.slice(0, 4);
  }

  enrollInCourse(course: CourseDto): void {
    if (course.id) {
      this.router.navigate(['/student/course', course.id, 'enroll']);
    } else {
      alert('Unable to enroll. Course ID is missing.');
    }
  }

  getCourseImage(course: CourseDto): string {
    // Try thumbnailUrl first, then fallback to a data URI placeholder
    if ((course as any).thumbnailUrl) {
      return this.courseService.getCourseThumbnailUrl(course);
    }

    // Return a data URI SVG placeholder as fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzliNjAxMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db3Vyc2UgSW1hZ2U8L3RleHQ+PC9zdmc+';
  }

  getCategoryName(course: CourseDto): string {
    return course.category?.name || 'General';
  }

  scrollToMyCourses(): void {
    const myCoursesElement = document.querySelector('app-my-courses');
    if (myCoursesElement) {
      myCoursesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.userMenuOpen = false;
      },
      error: (err: any) => {
        console.error('Logout error:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  getRewardPoints(): number {
    return this.currentUser?.rewardPoints || 0;
  }

  getCertificatesEarned(): number {
    return this.currentUser?.certificatesEarned || 0;
  }

  getStudentId(): string {
    return this.currentUser?.studentId || 'N/A';
  }

  // COUNTDOWN METHODS

  /**
   * Check if course has future pricing
   */
  hasFuturePricing(coursePrice: CoursePriceDto): boolean {
    return this.courseService.coursePriceService.willBecomePaid(coursePrice);
  }

  /**
   * Get countdown for course
   */
  getCountdown(coursePrice: CoursePriceDto): string | null {
    return this.courseService.coursePriceService.formatCountdown(coursePrice);
  }

  /**
   * Get countdown badge color based on urgency
   */
  getCountdownBadgeColor(coursePrice: CoursePriceDto): string {
    return this.courseService.coursePriceService.getCountdownBadgeColor(coursePrice);
  }

  /**
   * Start live countdown for a course card
   */
  startCountdown(courseId: number): void {
    // Clear existing interval if any
    if (this.countdownIntervals.has(courseId)) {
      clearInterval(this.countdownIntervals.get(courseId));
    }
    
    // Update every second - forces Angular change detection
    const interval = setInterval(() => {
      // The template will automatically re-render due to the interval
      // No explicit change detection needed
    }, 1000);
    
    this.countdownIntervals.set(courseId, interval);
  }

  /**
   * Stop countdown for a course
   */
  stopCountdown(courseId: number): void {
    if (this.countdownIntervals.has(courseId)) {
      clearInterval(this.countdownIntervals.get(courseId));
      this.countdownIntervals.delete(courseId);
    }
  }

  /**
   * Get future price display (what course will cost after countdown)
   */
  getFuturePrice(coursePrice: CoursePriceDto): string {
    const priceDto: CoursePriceDto = {
      ...coursePrice,
      isFree: false
    };
    return this.courseService.coursePriceService.formatPrice(priceDto);
  }

  /**
   * Get original price for discount display
   */
  getOriginalPrice(coursePrice: CoursePriceDto): string {
    const priceDto: CoursePriceDto = {
      ...coursePrice,
      currentPrice: coursePrice.originalPrice
    };
    return this.courseService.coursePriceService.formatPrice(priceDto);
  }

  // LIKE/FAVORITE METHODS

  /**
   * Load liked courses from localStorage
   */
  loadLikedCourses(): void {
    const stored = localStorage.getItem('likedCourses');
    if (stored) {
      try {
        const likedArray = JSON.parse(stored);
        this.likedCourseIds = new Set(likedArray);
      } catch (e) {
        console.error('Failed to load liked courses:', e);
        this.likedCourseIds = new Set();
      }
    }
  }

  /**
   * Save liked courses to localStorage
   */
  saveLikedCourses(): void {
    const likedArray = Array.from(this.likedCourseIds);
    localStorage.setItem('likedCourses', JSON.stringify(likedArray));
  }

  /**
   * Check if a course is liked
   */
  isCourseLiked(courseId: number | undefined): boolean {
    if (!courseId) return false;
    return this.likedCourseIds.has(courseId);
  }

  /**
   * Toggle like status for a course
   */
  toggleLike(course: CourseDto): void {
    if (!course.id) return;
    
    if (this.likedCourseIds.has(course.id)) {
      this.likedCourseIds.delete(course.id);
    } else {
      this.likedCourseIds.add(course.id);
    }
    
    this.saveLikedCourses();
  }
}
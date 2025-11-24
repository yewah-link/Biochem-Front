import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CourseDto, CourseService, CategoryDto } from '../../../core/course.service';
import { AuthService, UserDto } from '../../../core/auth/auth.service';
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

  // Track loading states
  private coursesLoaded = false;
  private enrollmentsLoaded = false;

  constructor(
    public courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 StudentDashboard: Initializing...');
    this.loadUserData();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  loadUserData(): void {
    this.userSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          this.isLoggedIn = true;
          this.userName = this.getUserDisplayName(user);
          this.userInitials = this.getUserInitials(user);
          console.log('👤 Current user loaded:', user.email);
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
    console.log('📚 Loading all published courses...');
    this.courseService.getPublishedCourses().subscribe({
      next: (coursesData: CourseDto[]) => {
        this.courses = coursesData;
        this.filteredCourses = coursesData;
        this.extractCategories();
        this.coursesLoaded = true;

        console.log('✅ Courses loaded:', this.courses.length);
        console.log('📋 Course IDs:', this.courses.map(c => ({ id: c.id, title: c.title })));

        // Update recommendations if enrollments already loaded
        if (this.enrollmentsLoaded) {
          this.logRecommendations();
        }
      },
      error: (err: any) => {
        console.error('❌ Failed to load courses:', err);
        this.coursesLoaded = true; // Still mark as loaded to prevent blocking
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
    console.log('🏷️ Categories extracted:', this.categories.length);
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
    console.log('🔍 Filtered courses:', this.filteredCourses.length);
  }

  isCategorySelected(categoryId: number | null): boolean {
    return this.selectedCategoryId === categoryId;
  }

  // Handler for enrolled course IDs from my-courses component
  onEnrolledCoursesLoaded(courseIds: number[]): void {
    console.log('📨 Received enrolled course IDs from my-courses:', courseIds);

    this.enrolledCourseIds = courseIds;
    this.enrollmentsLoaded = true;

    // Determine the categories of the enrolled courses
    const categoryIds = this.courses
      .filter(course => course.id && courseIds.includes(course.id))
      .map(course => course.category?.id)
      .filter((id): id is number => id !== undefined);

    // Remove duplicates
    this.enrolledCategoryIds = [...new Set(categoryIds)];

    console.log('✅ Enrolled course IDs stored:', this.enrolledCourseIds);
    console.log('🏷️ Enrolled category IDs:', this.enrolledCategoryIds);

    // Log recommendations for debugging
    if (this.coursesLoaded) {
      this.logRecommendations();
    }
  }

  // Helper method to log recommendations for debugging
  private logRecommendations(): void {
    const recommendations = this.getRecommendedCourses();
    console.log('⭐ RECOMMENDATIONS UPDATE:');
    console.log('   Total courses:', this.courses.length);
    console.log('   Enrolled courses:', this.enrolledCourseIds.length);
    console.log('   Recommended courses:', recommendations.length);
    console.log('   Recommendations:', recommendations.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category?.name
    })));
  }

  // Get recommended courses (ONLY courses the user is NOT enrolled in)
  getRecommendedCourses(): CourseDto[] {
    // If courses not loaded yet, return empty array
    if (!this.coursesLoaded) {
      console.log('⏳ Courses not loaded yet');
      return [];
    }

    // Filter out all enrolled courses
    const notEnrolledCourses = this.courses.filter(course => {
      // Make sure course has an ID
      if (!course.id) {
        console.log('⚠️ Course without ID found:', course.title);
        return false;
      }

      // Check if NOT in enrolled list
      const isNotEnrolled = !this.enrolledCourseIds.includes(course.id);

      if (!isNotEnrolled) {
        console.log('❌ Filtering out enrolled course:', course.id, course.title);
      }

      return isNotEnrolled;
    });

    console.log('🔍 Filtering recommendations:');
    console.log('   Total courses:', this.courses.length);
    console.log('   Enrolled courses:', this.enrolledCourseIds.length);
    console.log('   Available courses (not enrolled):', notEnrolledCourses.length);

    // If no courses available (user enrolled in all), return empty array
    if (notEnrolledCourses.length === 0) {
      console.log('🎉 User enrolled in all courses!');
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

      console.log('🎯 Same category courses:', sameCategoryCourses.length);
      console.log('📚 Other courses:', otherCourses.length);

      // Combine: prioritize same category, then others, limit to 4
      const recommendations = [...sameCategoryCourses, ...otherCourses].slice(0, 4);
      console.log('⭐ Final recommendations (with category priority):', recommendations.length);
      return recommendations;
    }

    // If no enrolled courses yet, just return first 4 available courses
    const recommendations = notEnrolledCourses.slice(0, 4);
    console.log('⭐ Final recommendations (no enrollments yet):', recommendations.length);
    return recommendations;
  }

  enrollInCourse(course: CourseDto): void {
    if (course.id) {
      console.log('🎓 Navigating to enroll in course:', course.id, course.title);
      this.router.navigate(['/student/course', course.id, 'enroll']);
    } else {
      console.error('❌ Course ID is missing for course:', course.title);
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
}

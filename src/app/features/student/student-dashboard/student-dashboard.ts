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
  enrolledCategoryIds: number[] = []; // ✨ NEW PROPERTY

  constructor(
    public courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
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
    // Note: In a real app, this would be an API call.
    // Assuming courseService.getPublishedCourses() returns an Observable<CourseDto[]>.
    this.courseService.getPublishedCourses().subscribe({
      next: (coursesData: CourseDto[]) => {
        this.courses = coursesData;
        this.filteredCourses = coursesData;
        this.extractCategories();
      },
      error: (err: any) => console.error('Failed to load courses:', err)
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

    // ✨ NEW LOGIC: Determine the categories of the enrolled courses
    const categoryIds = this.courses
      .filter(course => course.id && courseIds.includes(course.id))
      .map(course => course.category?.id)
      .filter((id): id is number => id !== undefined); // Filter out undefined/null IDs

    // Remove duplicates
    this.enrolledCategoryIds = [...new Set(categoryIds)];

    console.log('📚 Enrolled course IDs received:', this.enrolledCourseIds);
    console.log('✨ Enrolled Category IDs (for personalization):', this.enrolledCategoryIds);
    console.log('⭐ Recommended courses count:', this.getRecommendedCourses().length);
  }

  // Get recommended courses (excluding enrolled ones, prioritizing same category)
  getRecommendedCourses(): CourseDto[] {
    // 1. Get courses that the student is NOT enrolled in
    const availableCourses = this.courses.filter(course =>
      course.id && !this.enrolledCourseIds.includes(course.id)
    );

    // 2. Separate relevant courses (same category as enrolled courses)
    const highlyRelevant = availableCourses.filter(course =>
      course.category?.id && this.enrolledCategoryIds.includes(course.category.id)
    );

    // 3. Separate general/other courses
    const generalRecommendations = availableCourses.filter(course =>
      !course.category?.id || !this.enrolledCategoryIds.includes(course.category.id)
    );

    // 4. Combine them, prioritizing highly relevant courses, and slice to top 4.
    const recommended: CourseDto[] = [
      ...highlyRelevant,
      ...generalRecommendations
    ].slice(0, 4);

    return recommended;
  }

  enrollInCourse(course: CourseDto): void {
    if (course.id) {
      this.router.navigate(['/student/course', course.id, 'enroll']);
      console.log('Navigating to course enrollment:', course.id);
    } else {
      console.error('Course ID is missing for course:', course.title);
    }
  }

  // --- Display Helpers (from original code) ---
  getCourseImage(course: CourseDto): string {
    return (course as any).thumbnailUrl || 'assets/images/course-placeholder.png';
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

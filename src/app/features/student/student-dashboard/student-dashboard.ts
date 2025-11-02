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
      // Show all courses
      this.filteredCourses = this.courses;
    } else {
      // Filter by selected category
      this.filteredCourses = this.courses.filter(
        course => course.category?.id === categoryId
      );
    }
  }

  isCategorySelected(categoryId: number | null): boolean {
    return this.selectedCategoryId === categoryId;
  }

  enrollInCourse(course: CourseDto): void {
    if (course.id) {
      this.router.navigate(['/student/course', course.id, 'enroll']);
    }
  }

  getCourseImage(course: CourseDto): string {
    return course.thumbnailUrl || 'assets/images/course-placeholder.png';
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

  // Helper methods for course properties
  isNewCourse(course: CourseDto): boolean {
    if ((course as any).isNew) {
      return (course as any).isNew;
    }

    if (course.createdAt) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(course.createdAt) > thirtyDaysAgo;
    }

    return false;
  }

  getCourseLevel(course: CourseDto): string {
    return (course as any).level || 'Intermediate';
  }

  getCourseRating(course: CourseDto): string {
    return (course as any).rating?.toFixed(1) || '4.8';
  }

  getCourseReviews(course: CourseDto): string {
    const reviews = (course as any).reviews || (course as any).reviewCount;
    if (!reviews) return '2.4k';

    if (reviews >= 1000) {
      return `${(reviews / 1000).toFixed(1)}k`;
    }
    return reviews.toString();
  }

  getCourseStudents(course: CourseDto): string {
    const students = (course as any).students || (course as any).enrolledStudents || (course as any).studentCount;
    if (!students) return '12.5k';

    if (students >= 1000) {
      return `${(students / 1000).toFixed(1)}k`;
    }
    return students.toString();
  }
}

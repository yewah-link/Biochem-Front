import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CourseEnrollmentService, CourseEnrollmentDto } from '../../../core/course-enrollment.service';
import { AuthService } from '../../../core/auth/auth.service';



interface Course {
  id: number | undefined;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started';
  videoCount: number;
  duration: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.scss'
})
export class MyCourses implements OnInit {
  enrolledCourses = 0;
  completedCourses = 0;
  inProgressCourses = 0;

  courses: Course[] = [];
  isLoading = true;

  // Emit enrolled course IDs to parent component
  @Output() enrolledCourseIds = new EventEmitter<number[]>();

  constructor(
    private router: Router,
    private enrollmentService: CourseEnrollmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('MyCourses component initialized');
    this.loadEnrolledCourses();
  }

  loadEnrolledCourses(): void {
    // Get current user from AuthService
    const currentUser = this.authService.getCurrentUserValue();

    if (!currentUser || !currentUser.id) {
      console.error('No authenticated user found');
      this.isLoading = false;
      // Optionally redirect to login
      this.router.navigate(['/login']);
      return;
    }

    const userId = currentUser.id;
    console.log('Loading enrollments for userId:', userId);

    this.isLoading = true;
    console.log('Calling getUserEnrollments API...');

    this.enrollmentService.getUserEnrollments(userId).subscribe({
      next: (enrollments: CourseEnrollmentDto[]) => {
        console.log('Enrollments received:', enrollments);
        console.log('Number of enrollments:', enrollments.length);

        this.courses = enrollments.map(enrollment => this.mapEnrollmentToCourse(enrollment));
        console.log('Mapped courses:', this.courses);

        this.calculateStats();

        // Emit enrolled course IDs to parent (filter out undefined values)
        const courseIds = this.courses
          .map(course => course.id)
          .filter((id): id is number => id !== undefined);
        this.enrolledCourseIds.emit(courseIds);

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading enrolled courses:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Full error object:', error);
        this.isLoading = false;

        // Emit empty array on error
        this.enrolledCourseIds.emit([]);
      }
    });
  }

  private mapEnrollmentToCourse(enrollment: CourseEnrollmentDto): Course {
    const progress = enrollment.progressPercentage || 0;
    let status: 'completed' | 'in-progress' | 'not-started';

    if (enrollment.isCompleted) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'in-progress';
    } else {
      status = 'not-started';
    }

    // Calculate video count from the course's videos array
    const videoCount = enrollment.course?.videos?.length || 0;

    // Calculate total duration from all videos in the course
    const totalDurationSeconds = enrollment.course?.videos?.reduce((total, video) => {
      return total + (video.durationSeconds || 0);
    }, 0) || 0;

    const duration = this.formatDuration(totalDurationSeconds);

    // Use course.id if courseId is not available, or vice versa
    const courseId = enrollment.courseId || enrollment.course?.id;

    console.log('Mapping enrollment:', {
      enrollmentCourseId: enrollment.courseId,
      nestedCourseId: enrollment.course?.id,
      finalCourseId: courseId
    });

    return {
      id: courseId,
      title: enrollment.course?.title || 'Untitled Course',
      description: enrollment.course?.description || 'No description available',
      progress: progress,
      status: status,
      videoCount: videoCount,
      duration: duration
    };
  }

  private formatDuration(totalSeconds: number): string {
    if (totalSeconds === 0) return 'N/A';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  calculateStats(): void {
    this.enrolledCourses = this.courses.length;
    this.completedCourses = this.courses.filter(c => c.status === 'completed').length;
    this.inProgressCourses = this.courses.filter(c => c.status === 'in-progress').length;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/student/dashboard']);
  }

  // New method to navigate to learning page
  navigateToLearning(courseId: number | undefined): void {
    console.log('Navigating to learning with courseId:', courseId);

    if (!courseId) {
      console.error('Cannot navigate: courseId is null or undefined');
      alert('Unable to open this course. Course ID is missing.');
      return;
    }

    this.router.navigate(['/student/course', courseId, 'view']);
  }
}

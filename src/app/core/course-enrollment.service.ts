import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { CourseDto } from './course.service';

export interface CourseEnrollmentDto {
  id?: number;
  userId: number;
  courseId: number;
  course?: CourseDto;
  enrolledAt?: string;
  progressPercentage?: number;
  isCompleted?: boolean;
  completedAt?: string;
}

interface GenericResponseV2<T> {
  status: string;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CourseEnrollmentService {
  private apiUrl = 'http://localhost:8080/api/v1/enrollment';
  private currentEnrollmentSubject = new BehaviorSubject<CourseEnrollmentDto | null>(null);

  constructor(private http: HttpClient) {}

  // Enrollment operations
  enrollInCourse(userId: number, courseId: number): Observable<CourseEnrollmentDto> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('courseId', courseId.toString());
    return this.http.post<GenericResponseV2<CourseEnrollmentDto>>(`${this.apiUrl}/enroll`, null, { params }).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to enroll in course');
      })
    );
  }

  unenrollFromCourse(userId: number, courseId: number): Observable<void> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('courseId', courseId.toString());
    return this.http.delete<GenericResponseV2<void>>(`${this.apiUrl}/unenroll`, { params }).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return;
        throw new Error(res.message || 'Failed to unenroll from course');
      })
    );
  }

  // Read operations
  getUserEnrollments(userId: number): Observable<CourseEnrollmentDto[]> {
    return this.http.get<GenericResponseV2<CourseEnrollmentDto[]>>(`${this.apiUrl}/user/${userId}`).pipe(
      map(res => res._embedded || [])
    );
  }

  getCompletedCourses(userId: number): Observable<CourseEnrollmentDto[]> {
    return this.http.get<GenericResponseV2<CourseEnrollmentDto[]>>(`${this.apiUrl}/user/${userId}/completed`).pipe(
      map(res => res._embedded || [])
    );
  }

  getInProgressCourses(userId: number): Observable<CourseEnrollmentDto[]> {
    return this.http.get<GenericResponseV2<CourseEnrollmentDto[]>>(`${this.apiUrl}/user/${userId}/in-progress`).pipe(
      map(res => res._embedded || [])
    );
  }

  getEnrollment(userId: number, courseId: number): Observable<CourseEnrollmentDto> {
    return this.http.get<GenericResponseV2<CourseEnrollmentDto>>(`${this.apiUrl}/user/${userId}/course/${courseId}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch enrollment');
      })
    );
  }

  isUserEnrolled(userId: number, courseId: number): Observable<boolean> {
    return this.http.get<GenericResponseV2<boolean>>(`${this.apiUrl}/user/${userId}/course/${courseId}/is-enrolled`).pipe(
      map(res => res._embedded || false)
    );
  }

  // Progress tracking
  updateProgress(enrollmentId: number): Observable<CourseEnrollmentDto> {
    return this.http.put<GenericResponseV2<CourseEnrollmentDto>>(`${this.apiUrl}/${enrollmentId}/update-progress`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to update progress');
      })
    );
  }

  markCourseAsCompleted(enrollmentId: number): Observable<CourseEnrollmentDto> {
    return this.http.put<GenericResponseV2<CourseEnrollmentDto>>(`${this.apiUrl}/${enrollmentId}/mark-completed`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to mark course as completed');
      })
    );
  }

  calculateProgressPercentage(enrollmentId: number): Observable<number> {
    return this.http.get<GenericResponseV2<number>>(`${this.apiUrl}/${enrollmentId}/progress-percentage`).pipe(
      map(res => res._embedded || 0)
    );
  }

  // Get current enrollment
  getCurrentEnrollment(): Observable<CourseEnrollmentDto | null> {
    return this.currentEnrollmentSubject.asObservable();
  }

  // Set current enrollment
  setCurrentEnrollment(enrollment: CourseEnrollmentDto | null): void {
    this.currentEnrollmentSubject.next(enrollment);
  }

  // Helper method to check if course is completed
  isCourseCompleted(enrollment: CourseEnrollmentDto): boolean {
    return !!(enrollment && enrollment.isCompleted);
  }

  // Format progress percentage
  formatProgress(progressPercentage?: number): string {
    return progressPercentage ? `${progressPercentage}%` : '0%';
  }
}

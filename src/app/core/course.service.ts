import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';

export interface CategoryDto {
  id?: number;
  name: string;
  description?: string;
}

/**
 * Updated to match the backend Java VideosDto structure.
 */
export interface VideosDto {
  id?: number;
  title?: string; // Made optional for robustness
  description?: string;

  // Properties aligning with the backend's file storage approach:
  fileName?: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  thumbnailPath?: string;

  durationSeconds?: number; // The property name matching the backend
  orderIndex?: number; // Added to reflect backend sorting field

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Course Association
  courseId?: number;
  courseTitle?: string;
}

export interface NotesDto {
  id?: number;
  title: string;
  content?: string;
  fileUrl?: string;
}

export interface ExamDto {
  id?: number;
  title: string;
  description?: string;
  duration?: number;
  passingScore?: number;
}

export interface CourseDto {
  id?: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  category?: CategoryDto;
  totalVideos?: number;
  totalNotes?: number;
  totalExams?: number;
  estimatedHours?: number;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Videos array now references the corrected VideosDto
  videos?: VideosDto[];
  notes?: NotesDto[];
  exams?: ExamDto[];
}

interface GenericResponseV2<T> {
  status: string;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:8080/api/v1/course';
  private currentCourseSubject = new BehaviorSubject<CourseDto | null>(null);

  constructor(private http: HttpClient) {}

  // Admin operations
  createCourse(courseDto: CourseDto): Observable<CourseDto> {
    return this.http.post<GenericResponseV2<CourseDto>>(`${this.apiUrl}/create`, courseDto).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to create course');
      })
    );
  }

  updateCourse(id: number, courseDto: CourseDto): Observable<CourseDto> {
    return this.http.put<GenericResponseV2<CourseDto>>(`${this.apiUrl}/update/${id}`, courseDto).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to update course');
      })
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<GenericResponseV2<void>>(`${this.apiUrl}/delete/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return;
        throw new Error(res.message || 'Failed to delete course');
      })
    );
  }

  publishCourse(id: number): Observable<CourseDto> {
    return this.http.put<GenericResponseV2<CourseDto>>(`${this.apiUrl}/publish/${id}`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to publish course');
      })
    );
  }

  unpublishCourse(id: number): Observable<CourseDto> {
    return this.http.put<GenericResponseV2<CourseDto>>(`${this.apiUrl}/unpublish/${id}`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to unpublish course');
      })
    );
  }

  // Read operations
  getCourseById(id: number): Observable<CourseDto> {
    return this.http.get<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch course');
      })
    );
  }

  getAllCourses(): Observable<CourseDto[]> {
    return this.http.get<GenericResponseV2<CourseDto[]>>(`${this.apiUrl}`).pipe(
      map(res => res._embedded || [])
    );
  }

  getPublishedCourses(): Observable<CourseDto[]> {
    return this.http.get<GenericResponseV2<CourseDto[]>>(`${this.apiUrl}/published`).pipe(
      map(res => res._embedded || [])
    );
  }

  getCoursesByCategory(categoryId: number): Observable<CourseDto[]> {
    return this.http.get<GenericResponseV2<CourseDto[]>>(`${this.apiUrl}/category/${categoryId}`).pipe(
      map(res => res._embedded || [])
    );
  }

  searchCourses(title: string): Observable<CourseDto[]> {
    const params = new HttpParams().set('title', title);
    return this.http.get<GenericResponseV2<CourseDto[]>>(`${this.apiUrl}/search`, { params }).pipe(
      map(res => res._embedded || [])
    );
  }

  getCoursesPage(page: number, size: number): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<GenericResponseV2<any>>(`${this.apiUrl}/page`, { params }).pipe(
      map(res => res._embedded || null)
    );
  }

  // Course content management
  addVideoToCourse(courseId: number, videoId: number): Observable<CourseDto> {
    return this.http.post<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${courseId}/add-video/${videoId}`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to add video to course');
      })
    );
  }

  addNotesToCourse(courseId: number, notesId: number): Observable<CourseDto> {
    return this.http.post<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${courseId}/add-notes/${notesId}`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to add notes to course');
      })
    );
  }

  addExamToCourse(courseId: number, examId: number): Observable<CourseDto> {
    return this.http.post<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${courseId}/add-exam/${examId}`, {}).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to add exam to course');
      })
    );
  }

  removeVideoFromCourse(courseId: number, videoId: number): Observable<CourseDto> {
    return this.http.delete<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${courseId}/remove-video/${videoId}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to remove video from course');
      })
    );
  }

  removeNotesFromCourse(courseId: number, notesId: number): Observable<CourseDto> {
    return this.http.delete<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${courseId}/remove-notes/${notesId}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to remove notes from course');
      })
    );
  }

  removeExamFromCourse(courseId: number, examId: number): Observable<CourseDto> {
    return this.http.delete<GenericResponseV2<CourseDto>>(`${this.apiUrl}/${courseId}/remove-exam/${examId}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to remove exam from course');
      })
    );
  }

  // Get current course
  getCurrentCourse(): Observable<CourseDto | null> {
    return this.currentCourseSubject.asObservable();
  }

  // Set current course
  setCurrentCourse(course: CourseDto | null): void {
    this.currentCourseSubject.next(course);
  }

  // Get course thumbnail URL
  getCourseThumbnailUrl(course: CourseDto): string {
    return course.thumbnailUrl || 'assets/images/course-placeholder.png';
  }

  // Validate course ID helper
  isValidCourseId(course: CourseDto): boolean {
    return !!(course && course.id && course.id > 0);
  }

  /**
   * Converts duration in seconds to a human-readable string (e.g., 01:30 or 01:05:30).
   * @param durationSeconds The duration in seconds.
   * @returns A formatted duration string.
   */
  formatDuration(durationSeconds?: number): string {
    if (durationSeconds === undefined || durationSeconds === null || durationSeconds < 0) {
      return 'N/A';
    }

    const totalSeconds = Math.floor(durationSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

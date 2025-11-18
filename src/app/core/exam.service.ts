import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';

/**
 * Data Transfer Object representing a Course.
 */
export interface CourseDto {
  id?: number;
  title?: string;
  description?: string;
}

/**
 * Data Transfer Object representing an Exam.
 */
export interface ExamDto {
  id?: number;
  title?: string;
  description?: string;
  totalMarks?: number;
  passingMarks?: number;
  durationMinutes?: number;
  orderIndex?: number;
  isPublished?: boolean;
  createdDate?: string;
  courseId?: number;
  courseName?: string;
  course?: CourseDto;
}

/**
 * Generic API response wrapper.
 */
interface GenericResponse<T> {
  status: string;
  message: string;
  _embedded?: T;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:8080/api/v1/exam';

  constructor(private http: HttpClient) {}

  /**
   * Create a new exam.
   */
  createExam(examDto: ExamDto): Observable<ExamDto> {
    return this.http.post<GenericResponse<ExamDto>>(this.apiUrl, examDto).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Exam creation failed');
      })
    );
  }

  /**
   * Update an existing exam's metadata.
   */
  updateExam(id: number, examDto: ExamDto): Observable<ExamDto> {
    return this.http.put<GenericResponse<ExamDto>>(`${this.apiUrl}/${id}`, examDto).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Exam update failed');
      })
    );
  }

  /**
   * Fetch all exams in the system.
   */
  getAllExams(): Observable<ExamDto[]> {
    return this.http.get<GenericResponse<ExamDto[]>>(`${this.apiUrl}`).pipe(
      map(res => res._embedded || [])
    );
  }

  /**
   * Fetch an exam by its unique ID.
   */
  getExamById(id: number): Observable<ExamDto> {
    return this.http.get<GenericResponse<ExamDto>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch exam');
      })
    );
  }

  /**
   * Fetch all exams associated with a specific course.
   */
  getExamsByCourse(courseId: number): Observable<ExamDto[]> {
    return this.http.get<GenericResponse<ExamDto[]>>(`${this.apiUrl}/course/${courseId}`).pipe(
      map(res => res._embedded || [])
    );
  }

  /**
   * Delete an exam by its ID.
   */
  deleteExamById(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS') return;
        throw new Error(res.message || 'Failed to delete exam');
      })
    );
  }


}
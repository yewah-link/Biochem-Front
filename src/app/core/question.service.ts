import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Data Transfer Object representing a Choice.
 */
export interface ChoiceDto {
  id?: number;
  choiceText?: string;     
  correct?: boolean;        
  questionId?: number;
}

/**
 * Data Transfer Object representing a Question.
 */
export interface QuestionDto {
  id?: number;
  text?: string;
  type?: 'MULTIPLE_CHOICE' | 'WRITTEN';  // ✅ Changed to match backend enum
  marks?: number;
  examId?: number;
  choices?: ChoiceDto[];
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
export class QuestionService {
  private apiUrl = 'http://localhost:8080/api/v1/exam';

  constructor(private http: HttpClient) {}

  /**
   * Add a question to an exam.
   */
  addQuestion(examId: number, questionDto: QuestionDto): Observable<QuestionDto> {
    return this.http.post<GenericResponse<QuestionDto>>(
      `${this.apiUrl}/${examId}/questions`,
      questionDto
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to add question');
      })
    );
  }

  /**
   * Fetch all questions for a specific exam.
   */
  getQuestionsByExam(examId: number): Observable<QuestionDto[]> {
    return this.http.get<GenericResponse<QuestionDto[]>>(`${this.apiUrl}/${examId}/questions`).pipe(
      map(res => res._embedded || [])
    );
  }

  /**
   * Fetch a question by its unique ID.
   */
  getQuestionById(id: number): Observable<QuestionDto> {
    return this.http.get<GenericResponse<QuestionDto>>(`${this.apiUrl}/questions/${id}`).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to fetch question');
      })
    );
  }

  /**
   * Update an existing question.
   */
  updateQuestion(id: number, questionDto: QuestionDto): Observable<QuestionDto> {
    return this.http.put<GenericResponse<QuestionDto>>(
      `${this.apiUrl}/questions/${id}`,
      questionDto
    ).pipe(
      map(res => {
        if (res.status === 'SUCCESS' && res._embedded) {
          return res._embedded;
        }
        throw new Error(res.message || 'Failed to update question');
      })
    );
  }

  /**
   * Delete a question by its ID.
   */
  deleteQuestionById(id: number): Observable<void> {
    return this.http.delete<GenericResponse<void>>(`${this.apiUrl}/questions/${id}`).pipe(  // ✅ Fixed endpoint
      map(res => {
        if (res.status === 'SUCCESS') return;
        throw new Error(res.message || 'Failed to delete question');
      })
    );
  }
}
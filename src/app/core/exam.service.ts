import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

export interface CategoryDto {
  id: number;
  name: string;
}

export interface QuestionDto {
  id?: number;
  questionText: string;
  examId?: number;
}

export interface ExamDto {
  id?: number;
  title: string;
  description: string;
  createdDate?: string;
  category: CategoryDto;
  questions?: QuestionDto[];
}

export interface GenericResponseV2<T> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  _embedded: T;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
 private readonly baseUrl = 'http://localhost:8080/api/v1/exam';

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // Create a new exam
  createExam(examDto: ExamDto): Observable<GenericResponseV2<ExamDto>> {
    return this.http.post<GenericResponseV2<ExamDto>>(
      this.baseUrl,
      examDto,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  // GET all exams
  getAllExams(): Observable<GenericResponseV2<ExamDto[]>> {
    return this.http.get<GenericResponseV2<ExamDto[]>>(this.baseUrl)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // GET exam by ID
  getExamById(id: number): Observable<GenericResponseV2<ExamDto>> {
    return this.http.get<GenericResponseV2<ExamDto>>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // GET exams by category
  getExamsByCategory(categoryId: number): Observable<GenericResponseV2<ExamDto[]>> {
    return this.http.get<GenericResponseV2<ExamDto[]>>(`${this.baseUrl}/category/${categoryId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update exam
  updateExam(id: number, examDto: ExamDto): Observable<GenericResponseV2<ExamDto>> {
    return this.http.put<GenericResponseV2<ExamDto>>(
      `${this.baseUrl}/${id}`,
      examDto,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete exam
  deleteExam(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Add question to exam
  addQuestion(examId: number, questionDto: QuestionDto): Observable<GenericResponseV2<QuestionDto>> {
    return this.http.post<GenericResponseV2<QuestionDto>>(
      `${this.baseUrl}/${examId}/questions`,
      questionDto,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Get questions for a specific exam
  getQuestionsByExam(examId: number): Observable<GenericResponseV2<QuestionDto[]>> {
    return this.http.get<GenericResponseV2<QuestionDto[]>>(`${this.baseUrl}/${examId}/questions`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update question
  updateQuestion(id: number, questionDto: QuestionDto): Observable<GenericResponseV2<QuestionDto>> {
    return this.http.put<GenericResponseV2<QuestionDto>>(
      `${this.baseUrl}/questions/${id}`,
      questionDto,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Delete question
  deleteQuestion(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(`${this.baseUrl}/questions/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('ExamService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

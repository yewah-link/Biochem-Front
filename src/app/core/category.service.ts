import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryDto {
  id?: number;
  name: string;
  description?: string;
}

export interface GenericResponseV2<T> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  _embedded: T;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  getAllCategories() {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8080/api/v1/category';

  constructor(private http: HttpClient) {}

  getAll(): Observable<GenericResponseV2<CategoryDto[]>> {
    return this.http.get<GenericResponseV2<CategoryDto[]>>(this.apiUrl);
  }

  add(category: CategoryDto): Observable<GenericResponseV2<CategoryDto>> {
    return this.http.post<GenericResponseV2<CategoryDto>>(
      `${this.apiUrl}/add`,
      category
    );
  }

  update(id: number, category: CategoryDto): Observable<GenericResponseV2<CategoryDto>> {
    return this.http.put<GenericResponseV2<CategoryDto>>(
      `${this.apiUrl}/update/${id}`,
      category
    );
  }

  delete(id: number): Observable<GenericResponseV2<void>> {
    return this.http.delete<GenericResponseV2<void>>(
      `${this.apiUrl}/delete/${id}`
    );
  }

  getById(id: number): Observable<GenericResponseV2<CategoryDto>> {
    return this.http.get<GenericResponseV2<CategoryDto>>(
      `${this.apiUrl}/${id}`
    );
  }
}

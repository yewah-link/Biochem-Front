import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, map, of } from 'rxjs';

// Backend response wrapper
interface GenericResponse<T> {
  status: string;
  message: string;
  _embedded?: T;
}

export interface AuthResponse {
  token: string;
  user: {
    id?: number;
    email: string;
    role: string;
    subscriptionStatus?: string;
  };
}

export interface User {
  id?: number;
  email: string;
  role: string;
  subscriptionStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/auth';
  private tokenKey = 'authToken';
  private userKey = 'currentUser';
  
  // User state management
  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());

  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<any> {
    return this.http.post<GenericResponse<User>>(`${this.apiUrl}/register`, { email, password })
      .pipe(
        map(response => response._embedded)
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<GenericResponse<AuthResponse>>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS' && response._embedded) {
            return response._embedded;
          }
          throw new Error(response.message || 'Login failed');
        }),
        tap(authResponse => {
          if (authResponse.token && authResponse.user) {
            localStorage.setItem(this.tokenKey, authResponse.token);
            localStorage.setItem(this.userKey, JSON.stringify(authResponse.user));
            this.currentUserSubject.next(authResponse.user);
          }
        })
      );
  }

  logout(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.post<GenericResponse<void>>(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.clearLocalStorage();
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.post<GenericResponse<AuthResponse>>(`${this.apiUrl}/refresh`, {}, { headers })
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS' && response._embedded) {
            return response._embedded;
          }
          throw new Error(response.message || 'Token refresh failed');
        }),
        tap(authResponse => {
          if (authResponse.token && authResponse.user) {
            localStorage.setItem(this.tokenKey, authResponse.token);
            localStorage.setItem(this.userKey, JSON.stringify(authResponse.user));
            this.currentUserSubject.next(authResponse.user);
          }
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === 'ADMIN';
  }

  private clearLocalStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }
}
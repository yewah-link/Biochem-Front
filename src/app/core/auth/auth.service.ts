import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  user: {
    id?: number;
    email: string;
    role: string;
    subscriptionStatus?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:8080/auth';
  private tokenKey = 'authToken';

  constructor(private http: HttpClient) {}

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
        }
      })
    );
  }

  logout(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        localStorage.removeItem(this.tokenKey);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { headers }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub === 'abrahamyewah@gmail.com';
    } catch {
      return false;
    }
  }
}
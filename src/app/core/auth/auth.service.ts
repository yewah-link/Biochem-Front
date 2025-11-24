import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, tap, map, Subscription } from 'rxjs';
import { Router } from '@angular/router';

// Backend response wrapper
interface GenericResponseV2<T> {
  status: string;
  message: string;
  _embedded?: T;
}

export enum RoleType {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum SubscriptionStatus {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  TRIAL = 'TRIAL'
}

export interface UserDto {
  id?: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePhotoUrl?: string;
  studentId?: string;
  rewardPoints?: number;
  certificatesEarned?: number;
  role: RoleType;
  subscriptionStatus?: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyResetTokenRequest {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private apiUrl = 'http://localhost:8080/auth'; // ⚠️ Use HTTPS in production
  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  // User state management
  private currentUserSubject = new BehaviorSubject<UserDto | null>(this.getCurrentUserFromStorage());
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  // ✅ FIX: Store subscription to prevent memory leaks
  private tokenRefreshSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Start automatic token refresh check
    this.startTokenExpirationCheck();
  }

  ngOnDestroy(): void {
    // Clean up subscription on service destroy
    this.tokenRefreshSubscription?.unsubscribe();
  }

  // Register a new user
  register(registerRequest: RegisterRequest): Observable<UserDto> {
    return this.http.post<GenericResponseV2<UserDto>>(`${this.apiUrl}/register`, registerRequest)
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS' && response._embedded) {
            return response._embedded;
          }
          throw new Error(response.message || 'Registration failed');
        })
      );
  }

  // Login user
  login(authRequest: AuthRequest): Observable<AuthResponse> {
    return this.http.post<GenericResponseV2<AuthResponse>>(`${this.apiUrl}/login`, authRequest)
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS' && response._embedded) {
            return response._embedded;
          }
          throw new Error(response.message || 'Login failed');
        }),
        tap(authResponse => {
          this.setAuthData(authResponse.token, authResponse.user);
          // ✅ FIX: Don't restart - already running from constructor
        })
      );
  }

  // Logout user
  logout(): Observable<void> {
    return this.http.post<GenericResponseV2<void>>(`${this.apiUrl}/logout`, {})
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS') {
            this.clearAuthData();
            this.router.navigate(['/login']);
            return;
          }
          throw new Error(response.message || 'Logout failed');
        })
      );
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<GenericResponseV2<AuthResponse>>(`${this.apiUrl}/refresh`, null, { headers })
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS' && response._embedded) {
            return response._embedded;
          }
          throw new Error(response.message || 'Token refresh failed');
        }),
        tap(authResponse => {
          this.setAuthData(authResponse.token, authResponse.user);
        })
      );
  }

  // 🆕 Forgot Password - Request password reset email
  forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Observable<void> {
    return this.http.post<GenericResponseV2<void>>(`${this.apiUrl}/forgot-password`, forgotPasswordRequest)
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS') {
            return;
          }
          throw new Error(response.message || 'Failed to send password reset email');
        })
      );
  }

  // 🆕 Reset Password - Set new password with token
  resetPassword(resetPasswordRequest: ResetPasswordRequest): Observable<void> {
    return this.http.post<GenericResponseV2<void>>(`${this.apiUrl}/reset-password`, resetPasswordRequest)
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS') {
            return;
          }
          throw new Error(response.message || 'Password reset failed');
        })
      );
  }

  // 🆕 Verify Reset Token - Check if reset token is valid
  verifyResetToken(token: string): Observable<void> {
    return this.http.get<GenericResponseV2<void>>(`${this.apiUrl}/verify-reset-token`, {
      params: { token }
    })
      .pipe(
        map(response => {
          if (response.status === 'SUCCESS') {
            return;
          }
          throw new Error(response.message || 'Invalid or expired reset token');
        })
      );
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get current user observable
  getCurrentUser(): Observable<UserDto | null> {
    return this.currentUserSubject.asObservable();
  }

  // Get current user value (synchronous)
  getCurrentUserValue(): UserDto | null {
    return this.currentUserSubject.value;
  }

  // ✅ SECURITY: Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();

      // Add 30 second buffer
      return expirationDate.getTime() - now.getTime() < 30000;
    } catch (e) {
      console.error('Token decode error:', e);
      return true;
    }
  }

  // ✅ SECURITY: Decode JWT token safely
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  // ✅ SECURITY: Check if logged in with valid token
  isLoggedIn(): boolean {
    const hasToken = !!this.getToken();
    const hasUser = !!this.getCurrentUserValue();
    const tokenValid = !this.isTokenExpired();

    return hasToken && hasUser && tokenValid;
  }

  // ✅ SECURITY: Automatic token refresh before expiration
  private startTokenExpirationCheck(): void {
    // ✅ FIX: Unsubscribe from previous subscription if it exists
    this.tokenRefreshSubscription?.unsubscribe();

    // Check every minute if token needs refresh
    this.tokenRefreshSubscription = setInterval(() => {
      if (this.isLoggedIn() && this.shouldRefreshToken()) {
        this.refreshToken().subscribe({
          next: () => console.log('Token auto-refreshed'),
          error: (err) => {
            console.error('Auto token refresh failed:', err);
            this.clearAuthData();
            this.router.navigate(['/login']);
          }
        });
      }
    }, 60000) as any; // Type assertion needed for compatibility
  }

  // ✅ SECURITY: Check if token should be refreshed (5 minutes before expiry)
  private shouldRefreshToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return false;

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;

      return expirationDate.getTime() - now.getTime() < fiveMinutes;
    } catch (e) {
      return false;
    }
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === RoleType.ADMIN;
  }

  // Check if user is student
  isStudent(): boolean {
    const user = this.getCurrentUserValue();
    return user?.role === RoleType.STUDENT;
  }

  // Check if user has premium subscription
  hasPremiumSubscription(): boolean {
    const user = this.getCurrentUserValue();
    return user?.subscriptionStatus === SubscriptionStatus.PREMIUM;
  }

  // Get user's full name or email
  getUserDisplayName(): string {
    const user = this.getCurrentUserValue();
    return user?.fullName || user?.email || 'User';
  }

  // Get user's initials for avatar
  getUserInitials(): string {
    const user = this.getCurrentUserValue();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  // Get user's reward points
  getRewardPoints(): number {
    const user = this.getCurrentUserValue();
    return user?.rewardPoints || 0;
  }

  // Get user's certificates earned
  getCertificatesEarned(): number {
    const user = this.getCurrentUserValue();
    return user?.certificatesEarned || 0;
  }

  // Update user data in local storage (for profile updates)
  updateCurrentUser(user: UserDto): void {
    const token = this.getToken();
    if (token) {
      this.setAuthData(token, user);
    }
  }

  // Store auth data (token and user)
  private setAuthData(token: string, user: UserDto): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }

  // Clear auth data
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  // Load user from localStorage
  private getCurrentUserFromStorage(): UserDto | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserDto;
      } catch (e) {
        console.error('Failed to parse stored user data', e);
        this.clearAuthData();
        return null;
      }
    }
    return null;
  }
}  
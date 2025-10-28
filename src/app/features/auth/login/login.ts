import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AuthResponse, RoleType } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: (response: AuthResponse) => {
          console.log('Login successful:', response);
          this.successMessage = 'Login successful! Redirecting...';

          setTimeout(() => {
            this.navigateBasedOnRole(response.user.role);
          }, 1000);
        },
        error: (error: any) => {
          console.error('Login error:', error);
          this.errorMessage = error.message || 'Invalid email or password';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private navigateBasedOnRole(role: RoleType): void {
    switch (role) {
      case RoleType.ADMIN:
        this.router.navigate(['/dashboard']);
        break;
      case RoleType.STUDENT:
        this.router.navigate(['/student']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }

  getEmailError(): string {
    const emailCtrl = this.loginForm.get('email');
    if (emailCtrl?.hasError('required')) return 'Email is required';
    if (emailCtrl?.hasError('email')) return 'Invalid email format';
    return '';
  }

  getPasswordError(): string {
    const passCtrl = this.loginForm.get('password');
    if (passCtrl?.hasError('required')) return 'Password is required';
    if (passCtrl?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  

}

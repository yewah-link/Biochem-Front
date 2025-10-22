import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login successful:', response);

          // Navigate based on user role
          this.navigateBasedOnRole(response.user.role);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = error.message || 'Invalid email or password';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private navigateBasedOnRole(role: string) {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/dashboard']);
        break;
      case 'STUDENT':
        this.router.navigate(['/student']);
        break;
      case 'GUEST':
        this.router.navigate(['/guest-dashboard']);
        break;
      default:
        this.router.navigate(['/dashboard']);
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

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}

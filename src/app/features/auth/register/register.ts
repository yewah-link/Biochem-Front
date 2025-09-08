import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Auth } from '../../../core/auth/auth.service';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) {
    return null;
  }
  
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  registerForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  signupForm: any;

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.registerForm.value;

      this.authService.register(email, password).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.snackBar.open('Registration successful! Please log in.', 'Close', { 
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          // Redirect to login page after successful registration
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.errorMessage = error.message || 'Registration failed. Please try again.';
          
          this.snackBar.open(this.errorMessage, 'Close', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  getEmailError(): string {
    const emailCtrl = this.signupForm.get('email');
    if (emailCtrl?.hasError('required')) return 'Email is required';
    if (emailCtrl?.hasError('email')) return 'Invalid email format';
    return '';
  }

  getPasswordError(): string {
    const passCtrl = this.signupForm.get('password');
    if (passCtrl?.hasError('required')) return 'Password is required';
    if (passCtrl?.hasError('minlength')) return 'Password must be at least 6 characters';
    return '';
  }

  getConfirmPasswordError(): string {
    const confirmPassCtrl = this.signupForm.get('confirmPassword');
    if (confirmPassCtrl?.hasError('required')) return 'Please confirm your password';
    if (this.signupForm.hasError('passwordMismatch') && confirmPassCtrl?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  private markFormGroupTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }
}
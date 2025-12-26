import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss'
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  
  // Password reset state
  showForgotPassword = false;
  resetEmail = '';
  isResetting = false;
  resetSuccess = false;
  resetError = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  openForgotPassword() {
    this.showForgotPassword = true;
    this.resetEmail = this.loginForm.get('email')?.value || '';
    this.resetSuccess = false;
    this.resetError = '';
  }

  closeForgotPassword() {
    this.showForgotPassword = false;
    this.resetEmail = '';
    this.resetSuccess = false;
    this.resetError = '';
  }

  async sendPasswordReset() {
    if (!this.resetEmail || !this.resetEmail.includes('@')) {
      this.resetError = 'client.errors.email_invalid';
      return;
    }

    this.isResetting = true;
    this.resetError = '';

    try {
      await this.authService.sendPasswordReset(this.resetEmail);
      this.resetSuccess = true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        this.resetError = 'client.errors.user_not_found';
      } else {
        this.resetError = 'client.errors.reset_failed';
      }
    } finally {
      this.isResetting = false;
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      await this.authService.signIn(email, password);
      
      // Redirect to profile page
      this.router.navigate(['/client/profile']);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        this.errorMessage = 'client.errors.user_not_found';
      } else if (error.code === 'auth/wrong-password') {
        this.errorMessage = 'client.errors.wrong_password';
      } else if (error.code === 'auth/invalid-credential') {
        this.errorMessage = 'client.errors.invalid_credentials';
      } else {
        this.errorMessage = 'client.errors.login_failed';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

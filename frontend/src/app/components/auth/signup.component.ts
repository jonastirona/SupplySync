import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Create an Account</h2>
        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-control"
              [class.is-invalid]="name?.invalid && name?.touched"
            />
            <div class="invalid-feedback" *ngIf="name?.invalid && name?.touched">
              <span *ngIf="name?.errors?.['required']">Name is required</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [class.is-invalid]="email?.invalid && email?.touched"
            />
            <div class="invalid-feedback" *ngIf="email?.invalid && email?.touched">
              <span *ngIf="email?.errors?.['required']">Email is required</span>
              <span *ngIf="email?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="role">Account Type</label>
            <select
              id="role"
              formControlName="role"
              class="form-control"
              [class.is-invalid]="role?.invalid && role?.touched"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <div class="invalid-feedback" *ngIf="role?.invalid && role?.touched">
              <span *ngIf="role?.errors?.['required']">Role is required</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [class.is-invalid]="password?.invalid && password?.touched"
            />
            <div class="invalid-feedback" *ngIf="password?.invalid && password?.touched">
              <span *ngIf="password?.errors?.['required']">Password is required</span>
              <span *ngIf="password?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              class="form-control"
              [class.is-invalid]="confirmPassword?.invalid && confirmPassword?.touched"
            />
            <div class="invalid-feedback" *ngIf="confirmPassword?.invalid && confirmPassword?.touched">
              <span *ngIf="confirmPassword?.errors?.['required']">Please confirm your password</span>
              <span *ngIf="confirmPassword?.errors?.['passwordMismatch']">Passwords do not match</span>
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="signupForm.invalid || isLoading">
            {{ isLoading ? 'Creating account...' : 'Sign Up' }}
          </button>

          <p class="auth-link">
            Already have an account? <a routerLink="/auth/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f8f9fa;
      padding: 1rem;
    }

    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;

      h2 {
        color: #2c3e50;
        margin-bottom: 2rem;
        text-align: center;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: #2c3e50;
        font-weight: 500;
      }
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s ease;

      &:focus {
        outline: none;
        border-color: #0056b3;
      }

      &.is-invalid {
        border-color: #dc3545;
      }
    }

    select.form-control {
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1em;
      padding-right: 2.5rem;
    }

    .invalid-feedback {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      background-color: #0056b3;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover:not(:disabled) {
        background-color: #004494;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .auth-link {
      text-align: center;
      margin-top: 1.5rem;
      color: #6c757d;

      a {
        color: #0056b3;
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['staff', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  get name() { return this.signupForm.get('name'); }
  get email() { return this.signupForm.get('email'); }
  get role() { return this.signupForm.get('role'); }
  get password() { return this.signupForm.get('password'); }
  get confirmPassword() { return this.signupForm.get('confirmPassword'); }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.isLoading = true;
    this.authService.signup(this.signupForm.value).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Signup failed:', error);
        this.isLoading = false;
      }
    });
  }
} 
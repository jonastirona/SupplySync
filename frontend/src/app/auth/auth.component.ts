import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-auth',
  standalone: true,
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <mat-tab-group>
          <mat-tab label="Login">
            <form [formGroup]="loginForm" class="auth-form" (ngSubmit)="onLogin()">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" required />
                <mat-error *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</mat-error>
                <mat-error *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</mat-error>
              </mat-form-field>
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password" required />
                <mat-error *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</mat-error>
              </mat-form-field>
              <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loginForm.invalid">Login</button>
            </form>
          </mat-tab>
          
          <mat-tab label="Register">
            <form [formGroup]="registerForm" class="auth-form" (ngSubmit)="onRegister()">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" required />
                <mat-error *ngIf="registerForm.get('username')?.errors?.['required']">Username is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" required />
                <mat-error *ngIf="registerForm.get('email')?.errors?.['required']">Email is required</mat-error>
                <mat-error *ngIf="registerForm.get('email')?.errors?.['email']">Please enter a valid email</mat-error>
              </mat-form-field>
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password" type="password" required />
                <mat-error *ngIf="registerForm.get('password')?.errors?.['required']">Password is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Role Code</mat-label>
                <input matInput formControlName="roleCode" required />
                <mat-error *ngIf="registerForm.get('roleCode')?.errors?.['required']">Role code is required</mat-error>
              </mat-form-field>
              <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="registerForm.invalid">Register</button>
            </form>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .auth-form {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .full-width {
      width: 100%;
    }
    @media (max-width: 600px) {
      .auth-form {
        padding: 1rem;
      }
    }
  `],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule
  ]
})
export class AuthComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      roleCode: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/home']);
          this.snackBar.open('Login successful', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Login failed', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      const registerData = {
        username: this.registerForm.get('username')?.value,
        email: this.registerForm.get('email')?.value,
        password: this.registerForm.get('password')?.value,
        roleCode: this.registerForm.get('roleCode')?.value
      };
      
      console.log('Form values before sending:', registerData);
      
      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.router.navigate(['/home']);
          this.snackBar.open('Registration successful', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Registration error:', error);
          const errorMessage = error.error?.message || 
                             error.message || 
                             'Registration failed. Please try again.';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    }
  }
} 
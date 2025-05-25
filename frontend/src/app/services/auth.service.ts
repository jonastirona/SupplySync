import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
  role?: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  hasPermission(permission: 'manage_products' | 'adjust_quantities' | 'view_logs' | 'manage_users'): boolean {
    const userRole = this.currentUserSubject.value?.role;
    
    if (!userRole) return false;

    switch (permission) {
      case 'manage_products':
        return userRole === 'admin';
      case 'adjust_quantities':
        return true; // Both admin and staff can adjust quantities
      case 'view_logs':
        return userRole === 'admin';
      case 'manage_users':
        return userRole === 'admin';
      default:
        return false;
    }
  }

  // TODO: Replace with actual API calls
  login(credentials: LoginCredentials): Observable<User> {
    // Temporary mock implementation
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: 'Test User',
      // For demo: if email contains 'admin', assign admin role
      role: credentials.email.includes('admin') ? 'admin' : 'staff'
    };
    return of(mockUser).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  signup(credentials: SignupCredentials): Observable<User> {
    // Temporary mock implementation
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: credentials.name,
      role: credentials.role || 'staff' // Default to staff if no role specified
    };
    return of(mockUser).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}

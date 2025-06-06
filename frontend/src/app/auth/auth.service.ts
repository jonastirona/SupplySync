import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginCredentials {
  email: string;    // Keep lowercase for frontend
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
  roleCode: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use HTTP only since HTTPS is failing
  private readonly BASE_URL = 'http://localhost:5021';
  private readonly API_URL = `${this.BASE_URL}/api/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly ROLE_KEY = 'user_role';
  private readonly USERNAME_KEY = 'username';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userRoleSubject = new BehaviorSubject<string | null>(null);
  private usernameSubject = new BehaviorSubject<string | null>(null);
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkInitialAuth();
  }

  private checkInitialAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    const username = localStorage.getItem(this.USERNAME_KEY);
    this.isAuthenticatedSubject.next(!!token);
    this.userRoleSubject.next(role);
    this.usernameSubject.next(username);
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get userRole$(): Observable<string | null> {
    return this.userRoleSubject.asObservable();
  }

  get username$(): Observable<string | null> {
    return this.usernameSubject.asObservable();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    
    // Don't try fallback URL anymore since we're using HTTP directly
    if (error.status === 400) {
      console.error('Request body error:', error.error);
      throw error;
    }
    
    throw error;
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    const payload = {
      email: credentials.email,
      password: credentials.password
    };

    console.log('Sending login request to:', `${this.API_URL}/login`);
    console.log('Login payload (stringified):', JSON.stringify(payload));

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<any>(
      `${this.API_URL}/login`, 
      payload,
      { headers }
    ).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Login error details:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            headers: error.headers?.keys().map((key: string) => `${key}: ${error.headers?.get(key)}`)
          });
          throw error;
        }),
        tap(response => {
          // For login, we'll use the email as username since backend doesn't return it
          const authResponse: AuthResponse = {
            token: response.token,
            role: response.role,
            username: credentials.email.split('@')[0] // Use email prefix as username
          };
          this.handleAuthSuccess(authResponse);
        })
      );
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    const payload = {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
      roleCode: credentials.roleCode
    };
    
    console.log('Sending registration request to:', `${this.API_URL}/register`);
    console.log('Registration payload (stringified):', JSON.stringify(payload));
    
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    return this.http.post<any>(
      `${this.API_URL}/register`, 
      payload,
      { headers }
    ).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Registration error details:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            headers: error.headers?.keys().map((key: string) => `${key}: ${error.headers?.get(key)}`)
          });
          throw error;
        }),
        tap(response => {
          // For registration, use the username from the credentials
          const authResponse: AuthResponse = {
            token: response.token,
            role: response.role,
            username: credentials.username
          };
          this.handleAuthSuccess(authResponse);
        })
      );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.ROLE_KEY, response.role);
    localStorage.setItem(this.USERNAME_KEY, response.username);
    this.isAuthenticatedSubject.next(true);
    this.userRoleSubject.next(response.role);
    this.usernameSubject.next(response.username);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    this.isAuthenticatedSubject.next(false);
    this.userRoleSubject.next(null);
    this.usernameSubject.next(null);
    this.router.navigate(['/auth']);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }
} 
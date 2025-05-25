import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, request).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', user.token!);
        this.currentUserSubject.next(user);
      })
    );
  }

  register(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, request).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('token', user.token!);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'Admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
} 
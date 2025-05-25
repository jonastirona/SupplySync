import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalOrders: number;
  totalItems: number;
  totalSuppliers: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(error => {
        console.error('Error fetching dashboard stats:', error);
        // Return default values if API fails
        return of({
          totalOrders: 0,
          totalItems: 0,
          totalSuppliers: 0
        });
      })
    );
  }
} 
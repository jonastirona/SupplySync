import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Warehouse {
  id: string;
  name: string;
  locationCode: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  capacity: number;
  currentUtilization: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private readonly API_URL = 'http://localhost:5021/api/warehouses';

  constructor(private http: HttpClient) {}

  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(this.API_URL);
  }

  getWarehouse(id: string): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.API_URL}/${id}`);
  }

  createWarehouse(warehouse: Omit<Warehouse, 'id' | 'createdAt'>): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.API_URL, warehouse);
  }

  updateWarehouse(id: string, warehouse: Partial<Warehouse>): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.API_URL}/${id}`, warehouse);
  }

  deleteWarehouse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  productsSupplied: string[];
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private readonly BASE_URL = 'http://localhost:5021';
  private readonly API_URL = `${this.BASE_URL}/api/suppliers`;

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.API_URL);
  }

  getSupplier(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.API_URL}/${id}`);
  }

  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Observable<Supplier> {
    return this.http.post<Supplier>(this.API_URL, supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.API_URL}/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
} 
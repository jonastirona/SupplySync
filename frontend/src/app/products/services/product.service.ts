import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

interface WarehouseProductResponse {
  product: Product;
  warehouseInventory: {
    quantity: number;
    reorderThreshold: number;
    isLowStock: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly BASE_URL = 'http://localhost:5021';
  private readonly API_URL = `${this.BASE_URL}/api/products`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.API_URL);
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  getLowStockProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/low-stock`);
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Observable<Product> {
    return this.http.post<Product>(this.API_URL, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  getWarehouseProducts(warehouseId: string): Observable<WarehouseProductResponse[]> {
    return this.http.get<WarehouseProductResponse[]>(`${this.BASE_URL}/api/warehouses/${warehouseId}/products`);
  }
} 
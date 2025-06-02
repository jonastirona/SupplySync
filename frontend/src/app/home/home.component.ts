import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../products/services/product.service';
import { WarehouseService } from '../warehouses/services/warehouse.service';
import { SupplierService } from '../suppliers/services/supplier.service';
import { AuthService } from '../auth/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { Product } from '../products/models/product.model';
import { catchError } from 'rxjs/operators';

interface WarehouseMetric {
  name: string;
  utilizationPercentage: number;
}

interface ProductMetric {
  name: string;
  quantity: number;
  reorderThreshold: number;
}

interface ActivityLog {
  type: string;
  description: string;
  timestamp: Date;
}

interface DashboardMetrics {
  totalProducts: number;
  totalWarehouses: number;
  totalInventory: number;
  averageUtilization: number;
  totalSuppliers: number;
  averageProductCost: number;
  lowStockProducts: ProductMetric[];
  nearCapacityWarehouses: WarehouseMetric[];
  recentActivity: ActivityLog[];
}

interface LLMQueryResponse {
  question: string;
  generatedQuery: string;
  data: any[];
  processedAt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>System Overview</h1>
      <p class="welcome-message">Welcome, {{ userRole }} {{ userName }}</p>
      
      <!-- Key Metrics -->
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-details">
              <h3>Total Products</h3>
              <p class="metric-value">{{ metrics.totalProducts }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-details">
              <h3>Total Suppliers</h3>
              <p class="metric-value">{{ metrics.totalSuppliers }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-details">
              <h3>Total Inventory</h3>
              <p class="metric-value">{{ metrics.totalInventory }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-details">
              <h3>Warehouses</h3>
              <p class="metric-value">{{ metrics.totalWarehouses }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-details">
              <h3>Average Cost</h3>
              <p class="metric-value">{{ metrics.averageProductCost | currency }}</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card">
          <mat-card-content>
            <div class="metric-details">
              <h3>Average Utilization</h3>
              <p class="metric-value">{{ metrics.averageUtilization }}%</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Alerts and Warnings -->
      <div class="dashboard-section">
        <div class="section-grid">
          <!-- Low Stock Alerts -->
          <mat-card class="alert-card">
            <mat-card-header>
              <mat-card-title class="section-title">
                Low Stock Alerts
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="alert-list" *ngIf="metrics.lowStockProducts.length > 0">
                <div *ngFor="let product of metrics.lowStockProducts" class="alert-item">
                  <div class="alert-content">
                    <span class="product-name">{{ product.name }}</span>
                    <div class="stock-info">
                      <div class="stock-detail">
                        <span class="label">Current Stock:</span>
                        <span class="value" [class.critical]="product.quantity <= product.reorderThreshold">
                          {{ product.quantity | number:'1.0-0' }}
                        </span>
                      </div>
                      <div class="stock-detail">
                        <span class="label">Reorder At:</span>
                        <span class="value">{{ product.reorderThreshold | number:'1.0-0' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p *ngIf="metrics.lowStockProducts.length === 0" class="no-alerts">
                No low stock alerts
              </p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" routerLink="/products">
                View All Products
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Warehouse Capacity Warnings -->
          <mat-card class="alert-card">
            <mat-card-header>
              <mat-card-title class="section-title">
                Capacity Warnings
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="alert-list" *ngIf="metrics.nearCapacityWarehouses.length > 0">
                <div *ngFor="let warehouse of metrics.nearCapacityWarehouses" class="alert-item">
                  <div class="alert-content">
                    <div class="warehouse-info">
                      <span class="warehouse-name">{{ warehouse.name }}</span>
                      <span class="capacity-info">{{ warehouse.utilizationPercentage }}% Full</span>
                    </div>
                    <mat-progress-bar
                      [color]="getUtilizationColor(warehouse.utilizationPercentage)"
                      [value]="warehouse.utilizationPercentage"
                    ></mat-progress-bar>
                  </div>
                </div>
              </div>
              <p *ngIf="metrics.nearCapacityWarehouses.length === 0" class="no-alerts">
                No capacity warnings
              </p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" routerLink="/warehouses">
                View All Warehouses
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <!-- Natural Language Query Section -->
      <div class="query-section">
        <mat-card class="query-card">
          <mat-card-header>
            <mat-card-title>Natural Language Query</mat-card-title>
            <mat-card-subtitle>Ask questions about your inventory in plain English</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="query-input">
              <mat-form-field appearance="outline" class="query-field">
                <mat-label>Enter your question</mat-label>
                <input matInput [(ngModel)]="userQuery" 
                       placeholder="e.g., Find all products with price greater than 100" 
                       (keyup.enter)="executeQuery()"
                       [disabled]="isLoading">
                <mat-progress-spinner matSuffix *ngIf="isLoading" 
                                    mode="indeterminate" 
                                    diameter="20">
                </mat-progress-spinner>
              </mat-form-field>
              <button mat-raised-button 
                      color="primary" 
                      (click)="executeQuery()" 
                      [disabled]="!userQuery.trim() || isLoading"
                      class="query-button">
                Ask
              </button>
            </div>

            <div class="query-results" *ngIf="error || queryResponse">
              <div *ngIf="error" class="error-message">
                <mat-icon>error_outline</mat-icon>
                {{ error }}
              </div>

              <div *ngIf="queryResponse" class="response-container">
                <div class="query-info">
                  <div class="query-item">
                    <span class="label">Question:</span>
                    <span class="value">{{ queryResponse.question }}</span>
                  </div>
                  <div class="query-item">
                    <span class="label">Generated Query:</span>
                    <code class="query-code">{{ queryResponse.generatedQuery }}</code>
                  </div>
                </div>

                <ng-container *ngIf="queryResponse.data">
                  <div class="products-grid" *ngIf="queryResponse.data.length > 0">
                    <mat-card *ngFor="let product of queryResponse.data" class="product-card">
                      <mat-card-header>
                        <mat-card-title>{{ product.name || product.Name || 'Unnamed Product' }}</mat-card-title>
                        <mat-card-subtitle>
                          <div class="sku-label">SKU: {{ product.sku || product.SKU || 'No SKU' }}</div>
                          <div class="category-badge" *ngIf="product.category || product.Category">
                            {{ product.category || product.Category }}
                          </div>
                        </mat-card-subtitle>
                      </mat-card-header>
                      
                      <mat-card-content>
                        <p class="description">{{ product.description || product.Description || 'No description available' }}</p>
                        <div class="product-details">
                          <div class="detail-row">
                            <span class="label">Price:</span>
                            <span class="price">{{ (product.price || product.Price) | currency }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">Total Stock:</span>
                            <span class="quantity" [class.low-stock]="getTotalStock(product) < 10">
                              {{ getTotalStock(product) }}
                            </span>
                          </div>
                          <div class="detail-row" *ngIf="product.supplierId || product.SupplierId">
                            <span class="label">Supplier:</span>
                            <span class="supplier-info">
                              {{ getSupplierName(product.supplierId || product.SupplierId) }}
                            </span>
                          </div>
                          <div class="warehouses-section" *ngIf="(product.warehouses || product.Warehouses)?.length">
                            <span class="label">Warehouses:</span>
                            <div class="warehouse-list">
                              <div *ngFor="let warehouse of (product.warehouses || product.Warehouses)" class="warehouse-item">
                                <div class="warehouse-info">
                                  <span class="warehouse-name">{{ getWarehouseName(warehouse.warehouseId || warehouse.WarehouseId) }}</span>
                                  <span class="warehouse-quantity" [class.low-stock]="(warehouse.quantity || warehouse.Quantity) <= (warehouse.reorderThreshold || warehouse.ReorderThreshold)">
                                    Stock: {{ warehouse.quantity || warehouse.Quantity }}
                                    <span class="reorder-warning" *ngIf="(warehouse.quantity || warehouse.Quantity) <= (warehouse.reorderThreshold || warehouse.ReorderThreshold)">
                                      (Below reorder threshold of {{ warehouse.reorderThreshold || warehouse.ReorderThreshold }})
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>

                  <p *ngIf="queryResponse.data.length === 0" class="no-results">
                    No results found for your query
                  </p>
                </ng-container>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 32px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f5f5f5;
    }

    h1 {
      margin-bottom: 16px;
      color: #2c3e50;
      font-size: 2.2em;
      font-weight: 300;
      padding-bottom: 16px;
      border-bottom: 2px solid #e0e0e0;
    }

    .welcome-message {
      margin: -8px 0 24px;
      color: #7f8c8d;
      font-size: 1.1em;
      font-weight: 400;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }

    .metric-card {
      height: 100%;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .metric-card mat-card-content {
      padding: 24px;
      text-align: center;
    }

    .metric-details h3 {
      margin: 0;
      color: #7f8c8d;
      font-size: 1em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      margin: 16px 0 0;
      font-size: 2.4em;
      font-weight: 300;
      color: #2c3e50;
    }

    .section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 32px;
      margin-bottom: 40px;
    }

    .alert-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      background-color: white;
    }

    .section-title {
      font-size: 1.4em;
      font-weight: 400;
      color: #2c3e50;
      padding: 20px;
      margin-top: 12px;
      border-bottom: 1px solid #eee;
    }

    .alert-list {
      max-height: 350px;
      overflow-y: auto;
      padding: 16px;
    }

    .alert-item {
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 8px 0;
      transition: background-color 0.2s;
    }

    .alert-item:hover {
      background-color: #f1f3f5;
    }

    .alert-content {
      padding: 16px;
    }

    .product-name, .warehouse-name {
      font-weight: 500;
      color: #2c3e50;
      font-size: 1.1em;
      display: block;
      margin-bottom: 12px;
    }

    .stock-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stock-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: white;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .stock-detail .label {
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .stock-detail .value {
      font-weight: 500;
      color: #2c3e50;
    }

    .stock-detail .value.critical {
      color: #e74c3c;
    }

    .warehouse-info {
      margin-bottom: 12px;
    }

    .capacity-info {
      color: #7f8c8d;
      font-size: 0.95em;
    }

    .no-alerts {
      padding: 32px;
      text-align: center;
      color: #95a5a6;
      font-style: italic;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 16px;
    }

    .query-section {
      margin-top: 40px;
    }

    .query-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      background-color: white;
      transition: box-shadow 0.3s ease;
    }

    .query-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .query-card mat-card-header {
      padding: 24px 24px 0;
    }

    .query-card mat-card-title {
      color: #2c3e50;
      font-size: 1.5em;
      margin-bottom: 8px;
    }

    .query-card mat-card-subtitle {
      color: #7f8c8d;
      font-size: 1em;
    }

    .query-card mat-card-content {
      padding: 24px;
    }

    .query-input {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
    }

    .query-field {
      flex: 1;
    }

    .query-button {
      height: 56px;
      padding: 0 32px;
      font-size: 1em;
    }

    .query-results {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .error-message {
      color: #e74c3c;
      background-color: #fdf0ed;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }

    .response-container {
      width: 100%;
    }

    .query-info {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1px solid #e0e0e0;
    }

    .query-item {
      margin-bottom: 16px;
    }

    .query-item:last-child {
      margin-bottom: 0;
    }

    .query-item .label {
      font-weight: 500;
      color: #2c3e50;
      display: block;
      margin-bottom: 8px;
    }

    .query-item .value {
      color: #34495e;
      display: block;
      line-height: 1.5;
    }

    .query-code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 12px 16px;
      border-radius: 6px;
      display: block;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 0.9em;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .product-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background-color: white;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .product-card mat-card-header {
      padding: 16px 16px 0;
      border-bottom: 1px solid #eee;
    }

    .product-card mat-card-title {
      font-size: 1.4em;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .sku-label {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 4px;
    }

    .category-badge {
      display: inline-block;
      padding: 4px 8px;
      background-color: #3498db;
      color: white;
      border-radius: 12px;
      font-size: 0.8em;
      margin-top: 4px;
    }

    .product-card mat-card-content {
      flex-grow: 1;
      padding: 16px;
    }

    .description {
      color: #34495e;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .product-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .label {
      color: #7f8c8d;
      font-weight: 500;
    }

    .price {
      font-size: 1.2em;
      font-weight: 600;
      color: #27ae60;
    }

    .quantity {
      font-weight: 500;
      color: #2980b9;
    }

    .quantity.low-stock {
      color: #e74c3c;
    }

    .supplier-info {
      color: #34495e;
      font-weight: 500;
    }

    .warehouses-section {
      margin-top: 8px;
    }

    .warehouse-list {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .warehouse-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
      font-size: 0.9em;
      border-left: 4px solid #3498db;
    }

    .warehouse-item:hover {
      background-color: #f1f3f5;
    }

    .warehouse-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }

    .warehouse-name {
      color: #34495e;
      font-weight: 500;
    }

    .warehouse-quantity {
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .warehouse-quantity.low-stock {
      color: #e74c3c;
    }

    .reorder-warning {
      color: #e67e22;
      font-style: italic;
      margin-left: 8px;
    }

    .no-results {
      text-align: center;
      color: #7f8c8d;
      font-style: italic;
      padding: 32px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 16px 0;
    }
  `]
})
export class HomeComponent implements OnInit {
  metrics: DashboardMetrics = {
    totalProducts: 0,
    totalWarehouses: 0,
    totalInventory: 0,
    averageUtilization: 0,
    totalSuppliers: 0,
    averageProductCost: 0,
    lowStockProducts: [],
    nearCapacityWarehouses: [],
    recentActivity: []
  };

  userRole: string = '';
  userName: string = '';
  userQuery: string = '';
  isLoading: boolean = false;
  queryResponse: LLMQueryResponse | null = null;
  error: string | null = null;
  warehouses: { [key: string]: { name: string } } = {};
  suppliers: { [key: string]: { name: string } } = {};

  constructor(
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private supplierService: SupplierService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadSuppliers();
    this.authService.userRole$.subscribe((role: string | null) => {
      this.userRole = role || 'Guest';
    });
    this.authService.username$.subscribe((name: string | null) => {
      this.userName = name || 'User';
    });
  }

  loadDashboardData(): void {
    forkJoin({
      products: this.productService.getProducts(),
      warehouses: this.warehouseService.getWarehouses(),
      suppliers: this.supplierService.getSuppliers(),
      lowStock: this.productService.getLowStockProducts()
    }).subscribe({
      next: (data) => {
        // Store warehouse information
        data.warehouses.forEach(warehouse => {
          this.warehouses[warehouse.id] = { name: warehouse.name };
        });

        // Process warehouses data
        const warehousePromises = data.warehouses.map(warehouse =>
          this.productService.getWarehouseProducts(warehouse.id).toPromise()
        );

        Promise.all(warehousePromises).then(warehouseProducts => {
          // Calculate total inventory and warehouse utilization
          let totalInventory = 0;
          const nearCapacityWarehouses: WarehouseMetric[] = [];
          let totalUtilizationPercentage = 0;
          let activeWarehouses = 0;

          // Create a map to store total quantities per product
          const productTotals = new Map<string, number>();

          // Calculate total quantities for each product across all warehouses
          warehouseProducts.forEach(products => {
            if (!products) return;
            
            products.forEach(item => {
              const currentTotal = productTotals.get(item.product.id) || 0;
              productTotals.set(item.product.id, currentTotal + item.warehouseInventory.quantity);
            });
          });

          // Process warehouse utilization
          warehouseProducts.forEach((products, index) => {
            if (!products) return;
            
            const warehouse = data.warehouses[index];
            if (warehouse.capacity > 0) {
              activeWarehouses++;
              const totalQuantity = products.reduce((sum, item) => sum + item.warehouseInventory.quantity, 0);
              totalInventory += totalQuantity;

              const utilizationPercentage = Math.round((totalQuantity / warehouse.capacity) * 100);
              totalUtilizationPercentage += utilizationPercentage;

              if (utilizationPercentage >= 75) {
                nearCapacityWarehouses.push({
                  name: warehouse.name,
                  utilizationPercentage
                });
              }
            }
          });

          // Calculate average utilization only for warehouses with capacity > 0
          const averageUtilization = activeWarehouses > 0 
            ? Math.round(totalUtilizationPercentage / activeWarehouses)
            : 0;

          // Calculate average product cost
          const totalCost = data.products.reduce((sum, product) => sum + product.price, 0);
          const averageProductCost = data.products.length > 0 
            ? totalCost / data.products.length 
            : 0;

          // Process low stock products
          const lowStockProducts = data.lowStock.map(product => {
            const totalQuantity = productTotals.get(product.id) || 0;
            return {
              name: product.name,
              quantity: totalQuantity,
              reorderThreshold: product.warehouses[0]?.reorderThreshold || 0
            };
          });

          // Update metrics
          this.metrics = {
            totalProducts: data.products.length,
            totalWarehouses: data.warehouses.length,
            totalInventory,
            averageUtilization,
            totalSuppliers: data.suppliers.length,
            averageProductCost,
            lowStockProducts,
            nearCapacityWarehouses,
            recentActivity: []
          };
        });
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers.reduce((acc, supplier) => {
          acc[supplier.id] = { name: supplier.name };
          return acc;
        }, {} as { [key: string]: { name: string } });
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  getSupplierName(supplierId: string): string {
    return this.suppliers[supplierId]?.name || 'Unknown Supplier';
  }

  getUtilizationColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 75) return 'accent';
    return 'primary';
  }

  async executeQuery() {
    if (!this.userQuery.trim()) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.queryResponse = null;

    try {
      const response = await this.http.post<LLMQueryResponse>(
        'http://localhost:5021/api/llm/query',
        { question: this.userQuery },
        { 
          headers: { 'Content-Type': 'application/json' }
        }
      ).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Query error:', error);
          let errorMessage: string;
          
          switch (error.status) {
            case 504:
              errorMessage = 'The query took too long to process. Please try again or simplify your query.';
              break;
            case 400:
              errorMessage = error.error || 'Invalid query format. Please try rephrasing your question.';
              break;
            case 0:
              errorMessage = 'Cannot connect to the server. Please check if the backend service is running.';
              break;
            default:
              errorMessage = error.error || error.message || 'An unexpected error occurred. Please try again.';
          }
          
          throw errorMessage;
        })
      ).toPromise();

      console.log('Query Response:', response);
      if (response?.data) {
        console.log('First product in response:', response.data[0]);
      }

      this.queryResponse = response!;
    } catch (err: any) {
      this.error = err;
    } finally {
      this.isLoading = false;
    }
  }

  getObjectFields(obj: any): { key: string, value: any }[] {
    if (!obj) return [];
    return Object.entries(obj)
      .filter(([key]) => !key.startsWith('_')) // Filter out MongoDB internal fields
      .map(([key, value]) => ({ key, value }));
  }

  formatFieldName(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'number') {
      // Format currency if the field name suggests it's a price
      if (/price/i.test(value.toString())) {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
      }
      return value.toLocaleString();
    }

    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return new Date(value).toLocaleString();
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (typeof value[0] === 'object') {
        return `[${value.length} items]`;
      }
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  getTotalStock(product: any): number {
    const warehouses = product.warehouses || product.Warehouses;
    if (!warehouses?.length) return 0;
    return warehouses.reduce((total: number, warehouse: any) => 
      total + (warehouse.quantity || warehouse.Quantity || 0), 0);
  }

  getWarehouseName(warehouseId: string): string {
    return this.warehouses[warehouseId]?.name || 'Unknown Warehouse';
  }
} 
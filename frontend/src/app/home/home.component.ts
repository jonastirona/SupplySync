import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { ProductService } from '../products/services/product.service';
import { WarehouseService } from '../warehouses/services/warehouse.service';
import { SupplierService } from '../suppliers/services/supplier.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';
import { Product } from '../products/models/product.model';

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
  icon: string;
  iconColor: string;
  message: string;
  time: Date;
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
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

    mat-card-header {
      padding: 0;
      margin-bottom: 0;
    }

    mat-card-actions {
      padding: 16px;
      border-top: 1px solid #eee;
      margin: 0;
      display: flex;
      justify-content: flex-end;
    }

    mat-progress-bar {
      margin-top: 12px;
      height: 8px;
      border-radius: 4px;
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

  constructor(
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private supplierService: SupplierService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
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

  getUtilizationColor(percentage: number): string {
    if (percentage >= 90) return 'warn';
    if (percentage >= 75) return 'accent';
    return 'primary';
  }
} 
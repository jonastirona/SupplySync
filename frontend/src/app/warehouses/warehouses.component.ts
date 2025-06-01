import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WarehouseService, Warehouse } from './services/warehouse.service';
import { WarehouseDialogComponent } from './components/warehouse-dialog/warehouse-dialog.component';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../products/services/product.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface WarehouseWithProducts extends Warehouse {
  productCount: number;
  products: {
    id: string;
    name: string;
    quantity: number;
    reorderThreshold: number;
  }[];
}

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <div class="warehouses-container">
      <div class="warehouses-header">
        <h1>Warehouses</h1>
        <div class="header-actions">
          <button 
            *ngIf="isAdmin"
            mat-raised-button 
            color="primary" 
            class="add-warehouse-btn"
            (click)="openWarehouseDialog()">
            Add Warehouse
          </button>
        </div>
      </div>

      <div class="warehouses-grid">
        <mat-card *ngFor="let warehouse of warehouses" class="warehouse-card">
          <mat-card-header>
            <mat-card-title>{{ warehouse.name }}</mat-card-title>
            <mat-card-subtitle>
              <div class="location-info">
                <span class="location-code">{{ warehouse.locationCode }}</span>
              </div>
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="address-section">
              <h3>Address</h3>
              <p class="address">
                {{ warehouse.address.street }}<br>
                {{ warehouse.address.city }}, {{ warehouse.address.state }} {{ warehouse.address.zip }}<br>
                {{ warehouse.address.country }}
              </p>
            </div>

            <div class="capacity-section">
              <h3>Capacity Utilization</h3>
              <div class="utilization-info">
                <div class="utilization-text">
                  {{ warehouse.currentUtilization }} / {{ warehouse.capacity }}
                  ({{ getUtilizationPercentage(warehouse) }}%)
                </div>
                <mat-progress-bar
                  [color]="getUtilizationColor(warehouse)"
                  [value]="getUtilizationPercentage(warehouse)"
                >
                </mat-progress-bar>
              </div>
            </div>

            <div class="products-section" *ngIf="warehouse.products.length">
              <h3>Products Stored</h3>
              <div class="products-list">
                <div *ngFor="let product of warehouse.products" class="product-item">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-quantity" [class.low-stock]="product.quantity <= product.reorderThreshold">
                    Stock: {{ product.quantity }}
                    <span class="reorder-warning" *ngIf="product.quantity <= product.reorderThreshold">
                      (Below reorder threshold)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions *ngIf="isAdmin">
            <button mat-button color="primary" (click)="openWarehouseDialog(warehouse)">
              Edit
            </button>
            <button mat-button color="warn" (click)="deleteWarehouse(warehouse)" 
                    [disabled]="warehouse.products.length > 0">
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .warehouses-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f5f5f5;
    }

    .warehouses-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      background-color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .warehouses-header h1 {
      font-size: 2em;
      color: #2c3e50;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .add-warehouse-btn {
      background-color: #2ecc71 !important;
      color: white !important;
    }

    .add-warehouse-btn:hover {
      background-color: #27ae60 !important;
    }

    .warehouses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .warehouse-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background-color: white;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .warehouse-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .warehouse-card mat-card-header {
      padding: 16px 16px 0;
      border-bottom: 1px solid #eee;
    }

    .warehouse-card mat-card-title {
      font-size: 1.4em;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .location-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .location-code {
      font-family: monospace;
      background-color: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .warehouse-card mat-card-content {
      flex-grow: 1;
      padding: 16px;
      overflow: hidden;
    }

    .address-section, .capacity-section, .products-section {
      margin-bottom: 16px;
    }

    .address-section h3, .capacity-section h3, .products-section h3 {
      color: #34495e;
      font-size: 1.1em;
      margin: 0 0 8px 0;
    }

    .address {
      color: #7f8c8d;
      line-height: 1.5;
      margin: 0;
    }

    .utilization-info {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
    }

    .utilization-text {
      margin-bottom: 8px;
      color: #34495e;
      font-weight: 500;
    }

    .products-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
      background-color: #f9f9f9;
    }

    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
    }

    .product-item:last-child {
      border-bottom: none;
    }

    .product-name {
      font-weight: 500;
      color: #34495e;
    }

    .product-quantity {
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .product-quantity.low-stock {
      color: #e74c3c;
    }

    .reorder-warning {
      color: #e67e22;
      font-style: italic;
      margin-left: 8px;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px;
      gap: 8px;
      border-top: 1px solid #eee;
    }
  `]
})
export class WarehousesComponent implements OnInit {
  warehouses: WarehouseWithProducts[] = [];
  isAdmin = false;

  constructor(
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadWarehouses();
    this.authService.userRole$.subscribe(
      role => this.isAdmin = role === 'Admin'
    );
  }

  loadWarehouses(): void {
    this.warehouseService.getWarehouses().subscribe({
      next: (warehouses) => {
        // Load products for each warehouse
        const warehouseProductRequests = warehouses.map(warehouse => 
          this.productService.getWarehouseProducts(warehouse.id).pipe(
            map(response => {
              // Calculate total utilization from all products
              const totalUtilization = response.reduce((sum, item) => sum + item.warehouseInventory.quantity, 0);
              
              return {
                ...warehouse,
                productCount: response.length,
                currentUtilization: totalUtilization,
                products: response.map(item => ({
                  id: item.product.id,
                  name: item.product.name,
                  quantity: item.warehouseInventory.quantity,
                  reorderThreshold: item.warehouseInventory.reorderThreshold
                }))
              };
            })
          )
        );

        forkJoin(warehouseProductRequests).subscribe({
          next: (warehousesWithProducts) => {
            this.warehouses = warehousesWithProducts;
          },
          error: (error) => {
            console.error('Error loading warehouse products:', error);
            this.snackBar.open('Error loading warehouse products', 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('Error loading warehouses:', error);
        this.snackBar.open('Error loading warehouses', 'Close', { duration: 3000 });
      }
    });
  }

  openWarehouseDialog(warehouse?: Warehouse): void {
    const dialogRef = this.dialog.open(WarehouseDialogComponent, {
      data: warehouse || null,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (warehouse) {
          this.updateWarehouse(warehouse.id, result);
        } else {
          this.createWarehouse(result);
        }
      }
    });
  }

  createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt'>): void {
    this.warehouseService.createWarehouse(warehouseData).subscribe({
      next: () => {
        this.loadWarehouses();
        this.snackBar.open('Warehouse created successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error creating warehouse:', error);
        this.snackBar.open('Error creating warehouse', 'Close', { duration: 3000 });
      }
    });
  }

  updateWarehouse(id: string, warehouseData: Partial<Warehouse>): void {
    this.warehouseService.updateWarehouse(id, warehouseData).subscribe({
      next: () => {
        this.loadWarehouses();
        this.snackBar.open('Warehouse updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating warehouse:', error);
        this.snackBar.open('Error updating warehouse', 'Close', { duration: 3000 });
      }
    });
  }

  deleteWarehouse(warehouse: WarehouseWithProducts): void {
    if (warehouse.products.length > 0) {
      this.snackBar.open('Cannot delete warehouse with stored products', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete ${warehouse.name}?`)) {
      this.warehouseService.deleteWarehouse(warehouse.id).subscribe({
        next: () => {
          this.loadWarehouses();
          this.snackBar.open('Warehouse deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting warehouse:', error);
          this.snackBar.open('Error deleting warehouse', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getUtilizationPercentage(warehouse: Warehouse): number {
    if (!warehouse.capacity || warehouse.capacity === 0) return 0;
    return Math.min(Math.round((warehouse.currentUtilization / warehouse.capacity) * 100), 100);
  }

  getUtilizationColor(warehouse: Warehouse): string {
    const percentage = this.getUtilizationPercentage(warehouse);
    if (percentage >= 90) return 'warn';
    if (percentage >= 75) return 'accent';
    return 'primary';
  }
} 
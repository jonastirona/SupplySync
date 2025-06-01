import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from './services/product.service';
import { Product } from './models/product.model';
import { ProductDialogComponent } from './components/product-dialog/product-dialog.component';
import { AuthService } from '../auth/auth.service';
import { WarehouseService, Warehouse } from '../warehouses/services/warehouse.service';
import { SupplierService, Supplier } from '../suppliers/services/supplier.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="products-container">
      <div class="products-header">
        <h1>Products</h1>
        <div class="header-actions">
          <button 
            mat-raised-button 
            color="accent"
            class="low-stock-btn"
            (click)="viewLowStock()">
            {{ isLowStockView ? 'View All Products' : 'View Low Stock Items' }}
          </button>
          <button 
            *ngIf="isAdmin"
            mat-raised-button 
            color="primary" 
            class="add-product-btn"
            (click)="openProductDialog()">
            Add Product
          </button>
        </div>
      </div>

      <div class="products-grid">
        <mat-card *ngFor="let product of products" class="product-card">
          <mat-card-header>
            <mat-card-title>{{ product.name }}</mat-card-title>
            <mat-card-subtitle>
              <div class="sku-label">SKU: {{ product.sku }}</div>
              <div class="category-badge" *ngIf="product.category">{{ product.category }}</div>
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p class="description">{{ product.description }}</p>
            <div class="product-details">
              <div class="detail-row">
                <span class="label">Price:</span>
                <span class="price">{{ product.price | currency }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Stock:</span>
                <span class="quantity" [class.low-stock]="getTotalStock(product) < 10">
                  {{ getTotalStock(product) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Supplier:</span>
                <span class="supplier-info">
                  {{ getSupplierName(product.supplierId) }}
                  <span class="supplier-contact" *ngIf="getSupplierInfo(product.supplierId) as supplier">
                    ({{ supplier.contactEmail }})
                  </span>
                </span>
              </div>
              <div class="warehouses-section" *ngIf="product.warehouses?.length">
                <span class="label">Warehouses:</span>
                <div class="warehouse-list">
                  <div *ngFor="let warehouse of product.warehouses" class="warehouse-item">
                    <div class="warehouse-info">
                      <span class="warehouse-name">{{ getWarehouseName(warehouse.warehouseId) }}</span>
                      <span class="warehouse-quantity" [class.low-stock]="warehouse.quantity <= warehouse.reorderThreshold">
                        Stock: {{ warehouse.quantity }}
                        <span class="reorder-warning" *ngIf="warehouse.quantity <= warehouse.reorderThreshold">
                          (Below reorder threshold of {{ warehouse.reorderThreshold }})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions *ngIf="isAdmin">
            <button mat-button color="primary" (click)="openProductDialog(product)">
              Edit
            </button>
            <button mat-button color="warn" (click)="deleteProduct(product)">
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .products-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f5f5f5;
    }

    .products-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      background-color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .products-header h1 {
      font-size: 2em;
      color: #2c3e50;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .low-stock-btn {
      background-color: #3498db !important;
      color: white !important;
    }

    .low-stock-btn:hover {
      background-color: #2980b9 !important;
    }

    .add-product-btn {
      background-color: #2ecc71 !important;
      color: white !important;
    }

    .add-product-btn:hover {
      background-color: #27ae60 !important;
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

    .supplier-contact {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-left: 8px;
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

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px;
      gap: 8px;
      border-top: 1px solid #eee;
    }
  `]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  isAdmin = false;
  warehouses: { [key: string]: Warehouse } = {};
  suppliers: { [key: string]: Supplier } = {};
  isLowStockView = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private warehouseService: WarehouseService,
    private supplierService: SupplierService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadWarehouses();
    this.loadSuppliers();
    this.authService.userRole$.subscribe(
      role => this.isAdmin = role === 'Admin'
    );
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => this.products = products,
      error: (error) => {
        console.error('Error loading products:', error);
        this.snackBar.open('Error loading products', 'Close', { duration: 3000 });
      }
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getWarehouses().subscribe({
      next: (warehouses: Warehouse[]) => {
        this.warehouses = warehouses.reduce((acc: { [key: string]: Warehouse }, warehouse: Warehouse) => {
          acc[warehouse.id] = warehouse;
          return acc;
        }, {} as { [key: string]: Warehouse });
      },
      error: (error: Error) => {
        console.error('Error loading warehouses:', error);
      }
    });
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers: Supplier[]) => {
        this.suppliers = suppliers.reduce((acc: { [key: string]: Supplier }, supplier: Supplier) => {
          acc[supplier.id] = supplier;
          return acc;
        }, {} as { [key: string]: Supplier });
      },
      error: (error: Error) => {
        console.error('Error loading suppliers:', error);
      }
    });
  }

  getWarehouseName(warehouseId: string): string {
    return this.warehouses[warehouseId]?.name || 'Unknown Warehouse';
  }

  getSupplierName(supplierId: string): string {
    return this.suppliers[supplierId]?.name || 'Unknown Supplier';
  }

  getSupplierInfo(supplierId: string): Supplier | null {
    return this.suppliers[supplierId] || null;
  }

  getTotalStock(product: Product): number {
    return product.warehouses.reduce((total, warehouse) => total + warehouse.quantity, 0);
  }

  openProductDialog(product?: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      data: product || null,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (product) {
          this.updateProduct(product.id, result);
        } else {
          this.createProduct(result);
        }
      }
    });
  }

  createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.productService.createProduct(productData).subscribe({
      next: () => {
        this.loadProducts();
        this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error creating product:', error);
        this.snackBar.open('Error creating product', 'Close', { duration: 3000 });
      }
    });
  }

  updateProduct(id: string, productData: Partial<Product>): void {
    this.productService.updateProduct(id, productData).subscribe({
      next: () => {
        this.loadProducts();
        this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating product:', error);
        this.snackBar.open('Error updating product', 'Close', { duration: 3000 });
      }
    });
  }

  deleteProduct(product: Product): void {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
          this.snackBar.open('Product deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.snackBar.open('Error deleting product', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewLowStock(): void {
    this.isLowStockView = !this.isLowStockView;
    
    if (this.isLowStockView) {
      this.productService.getLowStockProducts().subscribe({
        next: (products: Product[]) => {
          this.products = products;
          if (products.length === 0) {
            this.snackBar.open('No products are currently low on stock', 'Close', { duration: 3000 });
            // If no low stock products, revert to all products
            this.isLowStockView = false;
            this.loadProducts();
          }
        },
        error: (error: Error) => {
          console.error('Error loading low stock products:', error);
          this.snackBar.open('Error loading low stock products', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.loadProducts();
    }
  }
} 
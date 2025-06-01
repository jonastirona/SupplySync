import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { SupplierService, Supplier } from './services/supplier.service';
import { ProductService } from '../products/services/product.service';
import { SupplierDialogComponent } from './components/supplier-dialog/supplier-dialog.component';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

interface SupplierWithProducts extends Supplier {
  productDetails: {
    id: string;
    name: string;
    price: number;
  }[];
}

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatListModule
  ],
  template: `
    <div class="suppliers-container">
      <div class="suppliers-header">
        <h1>Suppliers</h1>
        <div class="header-actions">
          <button 
            *ngIf="isAdmin"
            mat-raised-button 
            color="primary" 
            class="add-supplier-btn"
            (click)="openSupplierDialog()">
            Add Supplier
          </button>
        </div>
      </div>

      <div class="suppliers-grid">
        <mat-card *ngFor="let supplier of suppliers" class="supplier-card">
          <mat-card-header>
            <mat-card-title>{{ supplier.name }}</mat-card-title>
            <mat-card-subtitle>
              <div class="contact-info">
                <span class="email">{{ supplier.contactEmail }}</span>
                <span class="phone">{{ supplier.phone }}</span>
              </div>
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="address-section">
              <h3>Address</h3>
              <p class="address">
                {{ supplier.address.street }}<br>
                {{ supplier.address.city }}, {{ supplier.address.state }} {{ supplier.address.zip }}<br>
                {{ supplier.address.country }}
              </p>
            </div>

            <div class="products-section" *ngIf="supplier.productDetails?.length">
              <h3>Products Supplied</h3>
              <div class="products-list">
                <mat-list dense>
                  <mat-list-item *ngFor="let product of supplier.productDetails">
                    <span matListItemTitle>
                      {{ product.name }}
                      <span class="product-price">{{ product.price | currency }}</span>
                    </span>
                  </mat-list-item>
                </mat-list>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions *ngIf="isAdmin">
            <button mat-button color="primary" (click)="openSupplierDialog(supplier)">
              Edit
            </button>
            <button mat-button color="warn" (click)="deleteSupplier(supplier)" 
                    [disabled]="supplier.productsSupplied.length > 0">
              Delete
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .suppliers-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      background-color: #f5f5f5;
    }

    .suppliers-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      background-color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .suppliers-header h1 {
      font-size: 2em;
      color: #2c3e50;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .add-supplier-btn {
      background-color: #2ecc71 !important;
      color: white !important;
    }

    .add-supplier-btn:hover {
      background-color: #27ae60 !important;
    }

    .suppliers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .supplier-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background-color: white;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .supplier-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .supplier-card mat-card-header {
      padding: 16px 16px 0;
      border-bottom: 1px solid #eee;
    }

    .supplier-card mat-card-title {
      font-size: 1.4em;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #7f8c8d;
      font-size: 0.9em;
    }

    .supplier-card mat-card-content {
      flex-grow: 1;
      padding: 16px;
      overflow: hidden;
    }

    .address-section, .products-section {
      margin-bottom: 16px;
    }

    .address-section h3, .products-section h3 {
      color: #34495e;
      font-size: 1.1em;
      margin: 0 0 8px 0;
    }

    .address {
      color: #7f8c8d;
      line-height: 1.5;
      margin: 0;
    }

    .products-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
      background-color: #f9f9f9;
    }

    .products-list mat-list-item {
      height: 36px !important;
      font-size: 0.9em;
    }

    .product-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-price {
      margin-left: 16px;
      color: #3498db;
      font-weight: 500;
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
export class SuppliersComponent implements OnInit {
  suppliers: SupplierWithProducts[] = [];
  isAdmin = false;

  constructor(
    private supplierService: SupplierService,
    private productService: ProductService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.authService.userRole$.subscribe(
      role => this.isAdmin = role === 'Admin'
    );
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        // Create an array of observables for each supplier's products
        const productRequests = suppliers.map(supplier => 
          forkJoin(
            supplier.productsSupplied.map(productId => 
              this.productService.getProduct(productId)
            )
          ).pipe(
            map(products => ({
              ...supplier,
              productDetails: products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price
              }))
            }))
          )
        );

        // Wait for all product requests to complete
        forkJoin(productRequests).subscribe({
          next: (suppliersWithProducts) => {
            this.suppliers = suppliersWithProducts;
          },
          error: (error) => {
            console.error('Error loading product details:', error);
            this.snackBar.open('Error loading product details', 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.snackBar.open('Error loading suppliers', 'Close', { duration: 3000 });
      }
    });
  }

  openSupplierDialog(supplier?: Supplier): void {
    const dialogRef = this.dialog.open(SupplierDialogComponent, {
      data: supplier || null,
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (supplier) {
          this.updateSupplier(supplier.id, result);
        } else {
          this.createSupplier(result);
        }
      }
    });
  }

  createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'>): void {
    this.supplierService.createSupplier(supplierData).subscribe({
      next: () => {
        this.loadSuppliers();
        this.snackBar.open('Supplier created successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error creating supplier:', error);
        this.snackBar.open('Error creating supplier', 'Close', { duration: 3000 });
      }
    });
  }

  updateSupplier(id: string, supplierData: Partial<Supplier>): void {
    this.supplierService.updateSupplier(id, supplierData).subscribe({
      next: () => {
        this.loadSuppliers();
        this.snackBar.open('Supplier updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating supplier:', error);
        this.snackBar.open('Error updating supplier', 'Close', { duration: 3000 });
      }
    });
  }

  deleteSupplier(supplier: Supplier): void {
    if (supplier.productsSupplied.length > 0) {
      this.snackBar.open('Cannot delete supplier with associated products', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.loadSuppliers();
          this.snackBar.open('Supplier deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting supplier:', error);
          this.snackBar.open('Error deleting supplier', 'Close', { duration: 3000 });
        }
      });
    }
  }
} 
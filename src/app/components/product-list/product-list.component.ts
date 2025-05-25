import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.interface';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'description', 'price', 'quantity', 'actions'];
  products: Product[] = [];
  totalCount = 0;
  pageSize = 10;
  currentPage = 0;
  isAdmin = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts(this.currentPage + 1, this.pageSize).subscribe({
      next: (response) => {
        this.products = response.products;
        this.totalCount = response.totalCount;
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to load products.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.snackBar.open('Product deleted successfully', 'Close', { duration: 3000 });
        this.loadProducts();
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to delete product.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }
} 
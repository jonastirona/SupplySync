import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

interface Product {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="inventory-container">
      <div class="header">
        <h2>Inventory Management</h2>
        <button *hasPermission="'manage_products'" class="btn-primary" (click)="showAddProductModal()">
          Add Product
        </button>
      </div>

      <div class="products-grid">
        <div class="product-card" *ngFor="let product of products">
          <div class="product-header">
            <h3>{{product.name}}</h3>
            <div class="actions" *hasPermission="'manage_products'">
              <button class="btn-icon" (click)="editProduct(product)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon delete" (click)="deleteProduct(product)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <p class="description">{{product.description}}</p>
          <div class="product-details">
            <div class="detail">
              <span class="label">Quantity:</span>
              <span [class.low-stock]="product.quantity <= product.lowStockThreshold">
                {{product.quantity}}
              </span>
            </div>
            <div class="detail">
              <span class="label">Price:</span>
              <span>\${{product.price.toFixed(2)}}</span>
            </div>
          </div>
          <div class="quantity-controls" *hasPermission="'adjust_quantities'">
            <button class="btn-secondary" (click)="adjustQuantity(product, -1)">-</button>
            <input type="number" [value]="product.quantity" 
                   (change)="updateQuantity($event, product)" class="quantity-input">
            <button class="btn-secondary" (click)="adjustQuantity(product, 1)">+</button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Product Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <h3>{{editingProduct ? 'Edit' : 'Add'}} Product</h3>
          <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
            <div class="form-group">
              <label for="name">Product Name</label>
              <input type="text" id="name" formControlName="name" class="form-control">
              <div class="error" *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched">
                Product name is required
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" formControlName="description" class="form-control"></textarea>
            </div>

            <div class="form-group">
              <label for="price">Price</label>
              <input type="number" id="price" formControlName="price" class="form-control" min="0" step="0.01">
              <div class="error" *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched">
                Valid price is required
              </div>
            </div>

            <div class="form-group">
              <label for="quantity">Initial Quantity</label>
              <input type="number" id="quantity" formControlName="quantity" class="form-control" min="0">
              <div class="error" *ngIf="productForm.get('quantity')?.invalid && productForm.get('quantity')?.touched">
                Valid quantity is required
              </div>
            </div>

            <div class="form-group">
              <label for="lowStockThreshold">Low Stock Threshold</label>
              <input type="number" id="lowStockThreshold" formControlName="lowStockThreshold" class="form-control" min="0">
              <div class="error" *ngIf="productForm.get('lowStockThreshold')?.invalid && productForm.get('lowStockThreshold')?.touched">
                Valid threshold is required
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="productForm.invalid">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-container {
      padding: 1.5rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h2 {
        margin: 0;
        color: #2c3e50;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;

        h3 {
          margin: 0;
          color: #2c3e50;
        }
      }

      .description {
        color: #6c757d;
        margin-bottom: 1rem;
      }

      .product-details {
        margin-bottom: 1rem;

        .detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;

          .label {
            color: #6c757d;
          }

          .low-stock {
            color: #dc3545;
          }
        }
      }
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .quantity-input {
        width: 60px;
        text-align: center;
        padding: 0.25rem;
      }
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6c757d;
      border-radius: 4px;

      &:hover {
        background-color: #f8f9fa;
      }

      &.delete:hover {
        color: #dc3545;
        background-color: #fff5f5;
      }
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;

      h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #2c3e50;
      }
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: #2c3e50;
      }

      .error {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: #0056b3;
      }
    }

    textarea.form-control {
      min-height: 100px;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-primary {
      background-color: #0056b3;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;

      &:hover:not(:disabled) {
        background-color: #004494;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        background-color: #5a6268;
      }
    }
  `]
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  showModal = false;
  productForm: FormGroup;
  editingProduct: Product | null = null;

  constructor(private fb: FormBuilder) {
    this.productForm = this.createProductForm();
  }

  ngOnInit() {
    // TODO: Replace with API call
    this.products = [
      {
        id: '1',
        name: 'Sample Product',
        description: 'This is a sample product description',
        quantity: 10,
        price: 29.99,
        lowStockThreshold: 5
      }
    ];
  }

  createProductForm(product?: Product): FormGroup {
    return this.fb.group({
      name: [product?.name || '', Validators.required],
      description: [product?.description || ''],
      price: [product?.price || 0, [Validators.required, Validators.min(0)]],
      quantity: [product?.quantity || 0, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [product?.lowStockThreshold || 5, [Validators.required, Validators.min(0)]]
    });
  }

  showAddProductModal() {
    this.editingProduct = null;
    this.productForm = this.createProductForm();
    this.showModal = true;
  }

  editProduct(product: Product) {
    this.editingProduct = product;
    this.productForm = this.createProductForm(product);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingProduct = null;
  }

  saveProduct() {
    if (this.productForm.invalid) return;

    const productData = this.productForm.value;
    
    if (this.editingProduct) {
      // Update existing product
      const index = this.products.findIndex(p => p.id === this.editingProduct!.id);
      if (index !== -1) {
        this.products[index] = {
          ...this.editingProduct,
          ...productData
        };
      }
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now().toString(), // Temporary ID generation
        ...productData
      };
      this.products.push(newProduct);
    }

    this.closeModal();
  }

  deleteProduct(product: Product) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.products = this.products.filter(p => p.id !== product.id);
    }
  }

  adjustQuantity(product: Product, change: number) {
    const newQuantity = product.quantity + change;
    if (newQuantity >= 0) {
      product.quantity = newQuantity;
    }
  }

  updateQuantity(event: Event, product: Product) {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      product.quantity = newQuantity;
    }
  }
} 
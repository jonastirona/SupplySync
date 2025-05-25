import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  products: string[];
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="suppliers-container">
      <div class="header">
        <h2>Suppliers Management</h2>
        <button *hasPermission="'manage_products'" class="btn-primary" (click)="showAddSupplierModal()">
          Add Supplier
        </button>
      </div>

      <div class="suppliers-grid">
        <div class="supplier-card" *ngFor="let supplier of suppliers">
          <div class="supplier-header">
            <div>
              <h3>{{supplier.name}}</h3>
              <p class="status" [class.active]="supplier.status === 'active'">
                {{supplier.status}}
              </p>
            </div>
            <div class="actions" *hasPermission="'manage_products'">
              <button class="btn-icon" (click)="editSupplier(supplier)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon delete" (click)="deleteSupplier(supplier)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="supplier-details">
            <div class="detail">
              <i class="fas fa-envelope"></i>
              <a href="mailto:{{supplier.email}}">{{supplier.email}}</a>
            </div>
            <div class="detail">
              <i class="fas fa-phone"></i>
              <a href="tel:{{supplier.phone}}">{{supplier.phone}}</a>
            </div>
            <div class="detail">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{supplier.address}}</span>
            </div>
          </div>

          <div class="products-section">
            <h4>Supplied Products</h4>
            <div class="products-list">
              <span class="product-tag" *ngFor="let product of supplier.products">
                {{product}}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Supplier Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <h3>{{editingSupplier ? 'Edit' : 'Add'}} Supplier</h3>
          <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
            <div class="form-group">
              <label for="name">Supplier Name</label>
              <input type="text" id="name" formControlName="name" class="form-control">
              <div class="error" *ngIf="supplierForm.get('name')?.invalid && supplierForm.get('name')?.touched">
                Supplier name is required
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" formControlName="email" class="form-control">
              <div class="error" *ngIf="supplierForm.get('email')?.invalid && supplierForm.get('email')?.touched">
                <span *ngIf="supplierForm.get('email')?.errors?.['required']">Email is required</span>
                <span *ngIf="supplierForm.get('email')?.errors?.['email']">Please enter a valid email</span>
              </div>
            </div>

            <div class="form-group">
              <label for="phone">Phone</label>
              <input type="tel" id="phone" formControlName="phone" class="form-control">
              <div class="error" *ngIf="supplierForm.get('phone')?.invalid && supplierForm.get('phone')?.touched">
                Phone number is required
              </div>
            </div>

            <div class="form-group">
              <label for="address">Address</label>
              <textarea id="address" formControlName="address" class="form-control"></textarea>
              <div class="error" *ngIf="supplierForm.get('address')?.invalid && supplierForm.get('address')?.touched">
                Address is required
              </div>
            </div>

            <div class="form-group">
              <label for="products">Products (comma-separated)</label>
              <input type="text" id="products" formControlName="products" class="form-control">
              <div class="error" *ngIf="supplierForm.get('products')?.invalid && supplierForm.get('products')?.touched">
                At least one product is required
              </div>
            </div>

            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" formControlName="status" class="form-control">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="supplierForm.invalid">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .suppliers-container {
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

    .suppliers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .supplier-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .supplier-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1.5rem;

        h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
        }

        .status {
          font-size: 0.875rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: capitalize;
          background-color: #f8d7da;
          color: #721c24;

          &.active {
            background-color: #d4edda;
            color: #155724;
          }
        }
      }

      .supplier-details {
        margin-bottom: 1.5rem;

        .detail {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;

          i {
            color: #6c757d;
            width: 16px;
          }

          a {
            color: #0056b3;
            text-decoration: none;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      .products-section {
        h4 {
          margin: 0 0 1rem 0;
          color: #2c3e50;
        }

        .products-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .product-tag {
          background-color: #e9ecef;
          color: #495057;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.875rem;
        }
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
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  showModal = false;
  supplierForm: FormGroup;
  editingSupplier: Supplier | null = null;

  constructor(private fb: FormBuilder) {
    this.supplierForm = this.createSupplierForm();
  }

  ngOnInit() {
    // TODO: Replace with API call
    this.suppliers = [
      {
        id: '1',
        name: 'Sample Supplier',
        email: 'contact@supplier.com',
        phone: '+1 234 567 8900',
        address: '123 Supplier Street, City, Country',
        products: ['Product A', 'Product B', 'Product C'],
        status: 'active'
      }
    ];
  }

  createSupplierForm(supplier?: Supplier): FormGroup {
    return this.fb.group({
      name: [supplier?.name || '', Validators.required],
      email: [supplier?.email || '', [Validators.required, Validators.email]],
      phone: [supplier?.phone || '', Validators.required],
      address: [supplier?.address || '', Validators.required],
      products: [supplier?.products.join(', ') || '', Validators.required],
      status: [supplier?.status || 'active', Validators.required]
    });
  }

  showAddSupplierModal() {
    this.editingSupplier = null;
    this.supplierForm = this.createSupplierForm();
    this.showModal = true;
  }

  editSupplier(supplier: Supplier) {
    this.editingSupplier = supplier;
    this.supplierForm = this.createSupplierForm(supplier);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingSupplier = null;
  }

  saveSupplier() {
    if (this.supplierForm.invalid) return;

    const formValue = this.supplierForm.value;
    const supplierData = {
      ...formValue,
      products: formValue.products.split(',').map((p: string) => p.trim()).filter((p: string) => p)
    };

    if (this.editingSupplier) {
      // Update existing supplier
      const index = this.suppliers.findIndex(s => s.id === this.editingSupplier!.id);
      if (index !== -1) {
        this.suppliers[index] = {
          ...this.editingSupplier,
          ...supplierData
        };
      }
    } else {
      // Add new supplier
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        ...supplierData
      };
      this.suppliers.push(newSupplier);
    }

    this.closeModal();
  }

  deleteSupplier(supplier: Supplier) {
    if (confirm('Are you sure you want to delete this supplier?')) {
      this.suppliers = this.suppliers.filter(s => s.id !== supplier.id);
    }
  }
} 
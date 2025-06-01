import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Product, WarehouseInventory } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { SupplierService, Supplier } from '../../../suppliers/services/supplier.service';
import { WarehouseService, Warehouse } from '../../../warehouses/services/warehouse.service';

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Product</h2>
    <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="productForm.get('name')?.errors?.['required']">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Price</mat-label>
          <input matInput type="number" formControlName="price" required min="0" step="0.01">
          <mat-error *ngIf="productForm.get('price')?.errors?.['required']">
            Price is required
          </mat-error>
          <mat-error *ngIf="productForm.get('price')?.errors?.['min']">
            Price must be greater than or equal to 0
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Category</mat-label>
          <input matInput formControlName="category">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SKU</mat-label>
          <input matInput formControlName="sku" required>
          <mat-error *ngIf="productForm.get('sku')?.errors?.['required']">
            SKU is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Supplier</mat-label>
          <mat-select formControlName="supplierId" required>
            <mat-option *ngFor="let supplier of suppliers" [value]="supplier.id">
              {{ supplier.name }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="productForm.get('supplierId')?.errors?.['required']">
            Supplier is required
          </mat-error>
        </mat-form-field>

        <div formArrayName="warehouses" class="warehouses-section">
          <h3>Warehouse Inventory</h3>
          <div *ngFor="let warehouseCtrl of warehousesFormArray.controls; let i=index" 
               [formGroupName]="i" 
               class="warehouse-inventory-item">
            <mat-form-field appearance="outline">
              <mat-label>Warehouse</mat-label>
              <mat-select formControlName="warehouseId" required>
                <mat-option *ngFor="let warehouse of warehouses" [value]="warehouse.id">
                  {{ warehouse.name }} ({{ warehouse.locationCode }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Quantity</mat-label>
              <input matInput type="number" formControlName="quantity" required min="0">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Reorder Threshold</mat-label>
              <input matInput type="number" formControlName="reorderThreshold" required min="0">
            </mat-form-field>

            <button mat-icon-button color="warn" type="button" (click)="removeWarehouse(i)" 
                    *ngIf="warehousesFormArray.length > 1">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          
          <button mat-stroked-button type="button" (click)="addWarehouse()" class="add-warehouse-btn">
            <mat-icon>add</mat-icon> Add Warehouse
          </button>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid">
          {{ data ? 'Update' : 'Add' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
      padding: 20px;
    }

    .full-width {
      width: 100%;
    }

    .warehouses-section {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 16px;
      margin-top: 16px;
    }

    .warehouses-section h3 {
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .warehouse-inventory-item {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 16px;
      align-items: start;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .add-warehouse-btn {
      margin-top: 8px;
    }

    mat-dialog-actions {
      padding: 16px;
    }
  `]
})
export class ProductDialogComponent implements OnInit {
  productForm: FormGroup;
  suppliers: Supplier[] = [];
  warehouses: Warehouse[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product | null,
    private supplierService: SupplierService,
    private warehouseService: WarehouseService
  ) {
    this.productForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      description: [data?.description || ''],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      category: [data?.category || ''],
      sku: [data?.sku || '', Validators.required],
      supplierId: [data?.supplierId || '', Validators.required],
      warehouses: this.fb.array([])
    });

    // Initialize warehouses if editing
    if (data?.warehouses?.length) {
      data.warehouses.forEach(warehouse => this.addWarehouse(warehouse));
    } else {
      this.addWarehouse(); // Add one empty warehouse by default
    }
  }

  get warehousesFormArray() {
    return this.productForm.get('warehouses') as FormArray;
  }

  addWarehouse(warehouse?: WarehouseInventory) {
    const warehouseGroup = this.fb.group({
      warehouseId: [warehouse?.warehouseId || '', Validators.required],
      quantity: [warehouse?.quantity || 0, [Validators.required, Validators.min(0)]],
      reorderThreshold: [warehouse?.reorderThreshold || 10, [Validators.required, Validators.min(0)]]
    });

    this.warehousesFormArray.push(warehouseGroup);
  }

  removeWarehouse(index: number) {
    this.warehousesFormArray.removeAt(index);
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadWarehouses();
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers: Supplier[]) => this.suppliers = suppliers,
      error: (error: Error) => console.error('Error loading suppliers:', error)
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getWarehouses().subscribe({
      next: (warehouses: Warehouse[]) => this.warehouses = warehouses,
      error: (error: Error) => console.error('Error loading warehouses:', error)
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      this.dialogRef.close(formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
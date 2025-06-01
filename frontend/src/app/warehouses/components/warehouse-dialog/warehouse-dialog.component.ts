import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Warehouse } from '../../services/warehouse.service';

@Component({
  selector: 'app-warehouse-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Warehouse</h2>
    <form [formGroup]="warehouseForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="warehouseForm.get('name')?.errors?.['required']">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Location Code</mat-label>
          <input matInput formControlName="locationCode" required>
          <mat-error *ngIf="warehouseForm.get('locationCode')?.errors?.['required']">
            Location code is required
          </mat-error>
        </mat-form-field>

        <div formGroupName="address" class="address-section">
          <h3>Address</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Street</mat-label>
            <input matInput formControlName="street" required>
            <mat-error *ngIf="warehouseForm.get('address.street')?.errors?.['required']">
              Street is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>City</mat-label>
            <input matInput formControlName="city" required>
            <mat-error *ngIf="warehouseForm.get('address.city')?.errors?.['required']">
              City is required
            </mat-error>
          </mat-form-field>

          <div class="address-row">
            <mat-form-field appearance="outline">
              <mat-label>State</mat-label>
              <input matInput formControlName="state" required>
              <mat-error *ngIf="warehouseForm.get('address.state')?.errors?.['required']">
                State is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ZIP Code</mat-label>
              <input matInput formControlName="zip" required>
              <mat-error *ngIf="warehouseForm.get('address.zip')?.errors?.['required']">
                ZIP code is required
              </mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Country</mat-label>
            <input matInput formControlName="country" required>
            <mat-error *ngIf="warehouseForm.get('address.country')?.errors?.['required']">
              Country is required
            </mat-error>
          </mat-form-field>
        </div>

        <div class="capacity-section">
          <mat-form-field appearance="outline">
            <mat-label>Total Capacity</mat-label>
            <input matInput type="number" formControlName="capacity" required min="0">
            <mat-error *ngIf="warehouseForm.get('capacity')?.errors?.['required']">
              Capacity is required
            </mat-error>
            <mat-error *ngIf="warehouseForm.get('capacity')?.errors?.['min']">
              Capacity must be greater than or equal to 0
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Current Utilization</mat-label>
            <input matInput type="number" formControlName="currentUtilization" required min="0">
            <mat-error *ngIf="warehouseForm.get('currentUtilization')?.errors?.['required']">
              Current utilization is required
            </mat-error>
            <mat-error *ngIf="warehouseForm.get('currentUtilization')?.errors?.['min']">
              Current utilization must be greater than or equal to 0
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="warehouseForm.invalid">
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

    .address-section {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 16px;
      margin-top: 16px;
    }

    .address-section h3 {
      margin: 0 0 16px 0;
      color: rgba(0, 0, 0, 0.87);
    }

    .address-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .capacity-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    mat-dialog-actions {
      padding: 16px;
    }
  `]
})
export class WarehouseDialogComponent implements OnInit {
  warehouseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WarehouseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Warehouse | null
  ) {
    this.warehouseForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      locationCode: [data?.locationCode || '', Validators.required],
      address: this.fb.group({
        street: [data?.address?.street || '', Validators.required],
        city: [data?.address?.city || '', Validators.required],
        state: [data?.address?.state || '', Validators.required],
        zip: [data?.address?.zip || '', Validators.required],
        country: [data?.address?.country || '', Validators.required]
      }),
      capacity: [data?.capacity || 0, [Validators.required, Validators.min(0)]],
      currentUtilization: [data?.currentUtilization || 0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.warehouseForm.valid) {
      const warehouseData = this.warehouseForm.value;
      this.dialogRef.close(warehouseData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
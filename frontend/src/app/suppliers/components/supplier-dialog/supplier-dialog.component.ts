import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { Supplier } from '../../services/supplier.service';

@Component({
  selector: 'app-supplier-dialog',
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
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Supplier</h2>
    <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="supplierForm.get('name')?.errors?.['required']">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contact Email</mat-label>
          <input matInput type="email" formControlName="contactEmail" required>
          <mat-error *ngIf="supplierForm.get('contactEmail')?.errors?.['required']">
            Email is required
          </mat-error>
          <mat-error *ngIf="supplierForm.get('contactEmail')?.errors?.['email']">
            Please enter a valid email address
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" required>
          <mat-error *ngIf="supplierForm.get('phone')?.errors?.['required']">
            Phone number is required
          </mat-error>
        </mat-form-field>

        <div formGroupName="address" class="address-section">
          <h3>Address</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Street</mat-label>
            <input matInput formControlName="street" required>
            <mat-error *ngIf="supplierForm.get('address.street')?.errors?.['required']">
              Street is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>City</mat-label>
            <input matInput formControlName="city" required>
            <mat-error *ngIf="supplierForm.get('address.city')?.errors?.['required']">
              City is required
            </mat-error>
          </mat-form-field>

          <div class="address-row">
            <mat-form-field appearance="outline">
              <mat-label>State</mat-label>
              <input matInput formControlName="state" required>
              <mat-error *ngIf="supplierForm.get('address.state')?.errors?.['required']">
                State is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>ZIP Code</mat-label>
              <input matInput formControlName="zip" required>
              <mat-error *ngIf="supplierForm.get('address.zip')?.errors?.['required']">
                ZIP code is required
              </mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Country</mat-label>
            <input matInput formControlName="country" required>
            <mat-error *ngIf="supplierForm.get('address.country')?.errors?.['required']">
              Country is required
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="supplierForm.invalid">
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

    mat-dialog-actions {
      padding: 16px;
    }
  `]
})
export class SupplierDialogComponent implements OnInit {
  supplierForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Supplier | null
  ) {
    this.supplierForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      contactEmail: [data?.contactEmail || '', [Validators.required, Validators.email]],
      phone: [data?.phone || '', Validators.required],
      address: this.fb.group({
        street: [data?.address?.street || '', Validators.required],
        city: [data?.address?.city || '', Validators.required],
        state: [data?.address?.state || '', Validators.required],
        zip: [data?.address?.zip || '', Validators.required],
        country: [data?.address?.country || '', Validators.required]
      })
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.supplierForm.valid) {
      const supplierData = this.supplierForm.value;
      this.dialogRef.close(supplierData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 
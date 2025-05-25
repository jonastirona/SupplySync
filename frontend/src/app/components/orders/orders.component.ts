import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HasPermissionDirective } from '../../directives/has-permission.directive';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="orders-container">
      <div class="header">
        <h2>Orders Management</h2>
        <button class="btn-primary" (click)="showAddOrderModal()">Create Order</button>
      </div>

      <div class="orders-grid">
        <div class="order-card" *ngFor="let order of orders">
          <div class="order-header">
            <div>
              <h3>Order #{{order.orderNumber}}</h3>
              <p class="customer">{{order.customerName}}</p>
              <p class="date">{{order.orderDate | date:'medium'}}</p>
            </div>
            <div class="status" [class]="order.status">
              {{order.status}}
            </div>
          </div>

          <div class="order-items">
            <div class="item" *ngFor="let item of order.items">
              <span>{{item.productName}}</span>
              <span>{{item.quantity}} × {{item.price | currency}}</span>
            </div>
          </div>

          <div class="order-footer">
            <div class="total">
              <span>Total:</span>
              <span class="amount">{{order.total | currency}}</span>
            </div>
            <div class="actions">
              <button class="btn-secondary" (click)="updateStatus(order)" 
                      *ngIf="order.status !== 'completed' && order.status !== 'cancelled'">
                {{order.status === 'pending' ? 'Process' : 'Complete'}}
              </button>
              <button class="btn-danger" (click)="cancelOrder(order)"
                      *ngIf="order.status === 'pending'">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Order Modal -->
      <div class="modal" *ngIf="showModal">
        <div class="modal-content">
          <h3>Create New Order</h3>
          <form [formGroup]="orderForm" (ngSubmit)="saveOrder()">
            <div class="form-group">
              <label for="customerName">Customer Name</label>
              <input type="text" id="customerName" formControlName="customerName" class="form-control">
              <div class="error" *ngIf="orderForm.get('customerName')?.invalid && orderForm.get('customerName')?.touched">
                Customer name is required
              </div>
            </div>

            <div formArrayName="items">
              <div class="items-header">
                <h4>Order Items</h4>
                <button type="button" class="btn-secondary" (click)="addItem()">Add Item</button>
              </div>

              <div *ngFor="let item of items.controls; let i=index" [formGroupName]="i" class="item-form">
                <div class="form-group">
                  <label>Product Name</label>
                  <input type="text" formControlName="productName" class="form-control">
                </div>
                <div class="form-group">
                  <label>Quantity</label>
                  <input type="number" formControlName="quantity" class="form-control" min="1">
                </div>
                <div class="form-group">
                  <label>Price</label>
                  <input type="number" formControlName="price" class="form-control" min="0" step="0.01">
                </div>
                <button type="button" class="btn-icon delete" (click)="removeItem(i)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="orderForm.invalid">Create Order</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
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

    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .order-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1.5rem;

        h3 {
          margin: 0;
          color: #2c3e50;
        }

        .customer {
          margin: 0.5rem 0;
          color: #2c3e50;
          font-weight: 500;
        }

        .date {
          margin: 0;
          color: #6c757d;
          font-size: 0.875rem;
        }

        .status {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          text-transform: capitalize;

          &.pending {
            background-color: #fff3cd;
            color: #856404;
          }

          &.processing {
            background-color: #cce5ff;
            color: #004085;
          }

          &.completed {
            background-color: #d4edda;
            color: #155724;
          }

          &.cancelled {
            background-color: #f8d7da;
            color: #721c24;
          }
        }
      }

      .order-items {
        margin-bottom: 1.5rem;
        
        .item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e9ecef;

          &:last-child {
            border-bottom: none;
          }
        }
      }

      .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .total {
          font-weight: 500;

          .amount {
            color: #2c3e50;
            margin-left: 0.5rem;
          }
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }
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
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;

      h3 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        color: #2c3e50;
      }
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h4 {
        margin: 0;
        color: #2c3e50;
      }
    }

    .item-form {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto;
      gap: 1rem;
      align-items: end;
      margin-bottom: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
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

    .btn-danger {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        background-color: #c82333;
      }
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #6c757d;

      &.delete:hover {
        color: #dc3545;
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  showModal = false;
  orderForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.orderForm = this.createOrderForm();
  }

  ngOnInit() {
    // TODO: Replace with API call
    this.orders = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        orderDate: new Date(),
        status: 'pending',
        items: [
          {
            productId: '1',
            productName: 'Sample Product',
            quantity: 2,
            price: 29.99
          }
        ],
        total: 59.98
      }
    ];
  }

  createOrderForm(): FormGroup {
    return this.fb.group({
      customerName: ['', Validators.required],
      items: this.fb.array([])
    });
  }

  get items() {
    return this.orderForm.get('items') as any;
  }

  createItemFormGroup() {
    return this.fb.group({
      productName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addItem() {
    this.items.push(this.createItemFormGroup());
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  showAddOrderModal() {
    this.orderForm = this.createOrderForm();
    this.addItem(); // Add first item by default
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveOrder() {
    if (this.orderForm.invalid) return;

    const formValue = this.orderForm.value;
    const total = formValue.items.reduce((sum: number, item: OrderItem) => {
      return sum + (item.quantity * item.price);
    }, 0);

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      customerName: formValue.customerName,
      orderDate: new Date(),
      status: 'pending',
      items: formValue.items.map((item: any) => ({
        productId: Date.now().toString(),
        ...item
      })),
      total
    };

    this.orders.unshift(newOrder);
    this.closeModal();
  }

  updateStatus(order: Order) {
    if (order.status === 'pending') {
      order.status = 'processing';
    } else if (order.status === 'processing') {
      order.status = 'completed';
    }
  }

  cancelOrder(order: Order) {
    if (confirm('Are you sure you want to cancel this order?')) {
      order.status = 'cancelled';
    }
  }
} 
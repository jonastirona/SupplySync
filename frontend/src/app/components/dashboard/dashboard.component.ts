import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HasPermissionDirective],
  template: `
    <div class="dashboard-container">
      <h2>Welcome to SupplySync Dashboard, {{userRole}} {{userName}}!</h2>
      
      <div class="action-buttons">
        <button 
          routerLink="/inventory" 
          [class.disabled]="!isAdmin"
          [disabled]="!isAdmin"
          class="action-button">
          Add Inventory
        </button>
        <button 
          routerLink="/orders" 
          [class.disabled]="!isAdmin"
          [disabled]="!isAdmin"
          class="action-button">
          Add Orders
        </button>
        <button 
          routerLink="/suppliers" 
          [class.disabled]="!isAdmin"
          [disabled]="!isAdmin"
          class="action-button">
          Add Suppliers
        </button>
      </div>

      <div class="dashboard-stats" [class.loading]="isLoading">
        <div class="stat-card">
          <h3>Total Orders</h3>
          <p class="stat-value" *ngIf="!isLoading">{{stats.totalOrders}}</p>
          <p class="stat-value skeleton" *ngIf="isLoading">&nbsp;</p>
        </div>
        <div class="stat-card">
          <h3>Inventory Items</h3>
          <p class="stat-value" *ngIf="!isLoading">{{stats.totalItems}}</p>
          <p class="stat-value skeleton" *ngIf="isLoading">&nbsp;</p>
        </div>
        <div class="stat-card">
          <h3>Active Suppliers</h3>
          <p class="stat-value" *ngIf="!isLoading">{{stats.totalSuppliers}}</p>
          <p class="stat-value skeleton" *ngIf="isLoading">&nbsp;</p>
        </div>
      </div>

      <div class="error-message" *ngIf="error">
        {{error}}
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
      text-transform: capitalize;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .action-button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      background-color: #0056b3;
      color: white;
      transition: all 0.3s ease;

      &:hover:not(.disabled) {
        background-color: #004494;
      }

      &.disabled {
        background-color: #6c757d;
        cursor: not-allowed;
        opacity: 0.7;
      }
    }

    .dashboard-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;

      &.loading {
        opacity: 0.7;
      }
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      h3 {
        color: #6c757d;
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
      }

      .stat-value {
        color: #2c3e50;
        font-size: 2rem;
        font-weight: bold;
        margin: 0;

        &.skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }
      }
    }

    .error-message {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8d7da;
      color: #721c24;
      border-radius: 4px;
      text-align: center;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  isAdmin = false;
  userName = '';
  userRole = '';
  stats: DashboardStats = {
    totalOrders: 0,
    totalItems: 0,
    totalSuppliers: 0
  };
  isLoading = true;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {
    this.isAdmin = this.authService.isAdmin();
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.userRole = user.role;
      }
    });
  }

  ngOnInit() {
    this.loadDashboardStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardStats() {
    this.isLoading = true;
    this.error = '';
    
    this.dashboardService.getStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard statistics. Please try again later.';
        this.isLoading = false;
        console.error('Error loading dashboard stats:', err);
      }
    });
  }
}

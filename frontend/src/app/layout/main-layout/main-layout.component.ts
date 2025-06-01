import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [mode]="'side'"
          [opened]="true">
        <mat-toolbar>
          <span>Menu</span>
        </mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/products" routerLinkActive="active">
            <span>Products</span>
          </a>
          <a mat-list-item routerLink="/suppliers" routerLinkActive="active">
            <span>Suppliers</span>
          </a>
          <a mat-list-item routerLink="/warehouses" routerLinkActive="active">
            <span>Warehouses</span>
          </a>
          <mat-divider></mat-divider>
          <a mat-list-item *ngIf="!isAuthenticated" routerLink="/auth" routerLinkActive="active">
            <span>Login</span>
          </a>
          <a mat-list-item *ngIf="isAuthenticated" (click)="logout()">
            <span>Logout</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="drawer.toggle()" class="hamburger-button">
            <div class="hamburger-icon">
              <span class="line"></span>
              <span class="line"></span>
              <span class="line"></span>
            </div>
          </button>
          <span class="app-title">SupplySync</span>
          <span class="toolbar-spacer"></span>
          <span *ngIf="isAuthenticated" class="user-role">{{userRole}}</span>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100%;
    }
    
    .sidenav {
      width: 250px;
    }
    
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    .content {
      margin-top: 64px;
      height: calc(100vh - 64px);
    }
    
    .logo {
      height: 40px;
      margin-right: 16px;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      color: #2c3e50;
    }
    
    .menu-button {
      margin-right: 16px;
    }
    
    .user-role {
      margin-right: 16px;
      font-size: 14px;
    }
    
    .active {
      background: rgba(0, 0, 0, 0.04);
    }
    
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      height: 56px;
    }

    .hamburger-button {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hamburger-icon {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 18px;
      height: 14px;
    }

    .hamburger-icon .line {
      width: 100%;
      height: 2px;
      background-color: currentColor;
      border-radius: 1px;
    }

    mat-toolbar mat-icon {
      margin-right: 8px;
      font-size: 20px;
      height: 20px;
      width: 20px;
      line-height: 20px;
    }

    .app-title {
      font-size: 18px;
      font-weight: 500;
      margin-left: 8px;
    }

    mat-nav-list mat-icon {
      margin-right: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
      line-height: 18px;
    }

    button[mat-icon-button] {
      width: 36px;
      height: 36px;
      line-height: 36px;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  isAuthenticated = false;
  userRole: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
    this.authService.userRole$.subscribe(
      role => this.userRole = role
    );
  }

  logout() {
    this.authService.logout();
  }
} 
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <mat-toolbar color="primary">
      <span>SupplySync</span>
      <span class="spacer"></span>
      <button mat-button (click)="onLogout()">Logout</button>
    </mat-toolbar>
    <div class="content">
      <h1>Welcome to SupplySync</h1>
      <p>Your supply chain management solution</p>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .content {
      padding: 2rem;
      text-align: center;
    }
    h1 {
      margin-bottom: 1rem;
      color: #333;
    }
    p {
      color: #666;
      font-size: 1.2rem;
    }
  `],
  imports: [
    CommonModule,
    MatButtonModule,
    MatToolbarModule
  ]
})
export class HomeComponent {
  constructor(private authService: AuthService) {}

  onLogout() {
    this.authService.logout();
  }
} 
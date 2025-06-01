import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './auth/auth.guard';
import { ProductsComponent } from './products/products.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { WarehousesComponent } from './warehouses/warehouses.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent, canActivate: [authGuard] },
      { path: 'dashboard', component: HomeComponent, canActivate: [authGuard] },  // Placeholder
      { path: 'products', component: ProductsComponent, canActivate: [authGuard] },
      { path: 'suppliers', component: SuppliersComponent, canActivate: [authGuard] },
      { path: 'warehouses', component: WarehousesComponent, canActivate: [authGuard] }
    ]
  },
  { path: 'auth', component: AuthComponent },
  { path: '**', redirectTo: 'home' }
];

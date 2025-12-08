import { Routes } from '@angular/router';
import { Products } from './components/products/products';
import { AdminProducts } from './components/admin-products/admin-products';

export const routes: Routes = [
  { path: '', component: Products },          // Default route → Products page
  { path: 'admin/products', component: AdminProducts }, // Admin page
  { path: '**', redirectTo: '' }              // Fallback → Products page
];

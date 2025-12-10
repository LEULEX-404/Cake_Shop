import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from "@angular/router";

interface Product {
  id: number;
  barcode: string;
  name: string;
  type: string;
  price?: number;
  pricePerKg?: number;
  stockQty: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-products.html',
  styleUrls: ['./admin-products.css']
})
export class AdminProducts implements OnInit, OnDestroy {

  productList: Product[] = [];
  filteredProductList: Product[] = [];

  message: string = '';
  messageType: string = '';

  showModal: boolean = false;
  isEditMode: boolean = false;
  selectedProduct: Product = this.getEmptyProduct();

  searchTerm = '';
  filterType = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadProducts();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  // Keyboard shortcuts handler
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+A or Ctrl+a - Add Product
    if (event.ctrlKey && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      this.openAddModal();
    }
    
    // Ctrl+E or Ctrl+e - Export CSV
    if (event.ctrlKey && (event.key === 'e' || event.key === 'E')) {
      event.preventDefault();
      this.exportCSV();
    }
    
    // F1 - Go to Billing
    if (event.key === 'F2') {
      event.preventDefault();
      this.goToBilling();
    }
    
    // Ctrl+R or Ctrl+r - Go to Reports
    if (event.ctrlKey && (event.key === 'r' || event.key === 'R')) {
      event.preventDefault();
      this.goToReports();
    }

    // ESC - Close Modal
    if (event.key === 'Escape' && this.showModal) {
      this.closeModal();
    }
  }

  // Reset empty product
  getEmptyProduct(): Product {
    return {
      id: 0,
      barcode: '',
      name: '',
      type: 'fixed',
      price: 0,
      pricePerKg: 0,
      stockQty: 0
    };
  }

  // Load from backend
  loadProducts() {
    this.http.get<Product[]>('http://localhost:5277/api/admin/adminproduct')
      .subscribe({
        next: (data) => {
          this.productList = data;
          this.filterProducts();
        },
        error: () => this.showMessage('Error loading products', 'error')
      });
  }

  // Open modal
  openAddModal() {
    this.isEditMode = false;
    this.selectedProduct = this.getEmptyProduct();
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.isEditMode = true;
    this.selectedProduct = { ...product };
    this.showModal = true;
  }
 
  closeModal() {
    this.showModal = false;
  }

  // Save or update
  saveProduct() {
    if (!this.selectedProduct.name || !this.selectedProduct.barcode) {
      return this.showMessage('Please fill all required fields', 'error');
    }

    if (this.selectedProduct.type === 'fixed' && (this.selectedProduct.price ?? 0) < 0) {
      return this.showMessage('Price must be >= 0', 'error');
    }

    if (this.selectedProduct.type === 'weight' && (this.selectedProduct.pricePerKg ?? 0) < 0) {
      return this.showMessage('Price per Kg must be >= 0', 'error');
    }

    if (this.isEditMode) {
      this.http.put(`http://localhost:5277/api/admin/adminproduct/${this.selectedProduct.id}`,
        this.selectedProduct)
        .subscribe({
          next: () => {
            this.showMessage('Product updated successfully', 'success');
            this.closeModal();
            this.loadProducts();
          },
          error: () => this.showMessage('Error updating product', 'error')
        });
    } else {
      this.http.post(`http://localhost:5277/api/admin/adminproduct`,
        this.selectedProduct)
        .subscribe({
          next: () => {
            this.showMessage('Product added successfully', 'success');
            this.closeModal();
            this.loadProducts();
          },
          error: () => this.showMessage('Error adding product', 'error')
        });
    }
  }

  // Delete item
  deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return;

    this.http.delete(`http://localhost:5277/api/admin/adminproduct/${id}`)
      .subscribe({
        next: () => {
          this.showMessage('Product deleted successfully', 'success');
          this.loadProducts();
        },
        error: () => this.showMessage('Error deleting product', 'error')
      });
  }

  // Alert message
  showMessage(msg: string, type: string) {
    this.message = msg;
    this.messageType = type;

    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  // Filter logic
  filterProducts() {
    this.filteredProductList = this.productList.filter(p => {
      const s = this.searchTerm.toLowerCase();

      const matchesSearch =
        !s ||
        p.name.toLowerCase().includes(s) ||
        p.barcode.toLowerCase().includes(s);

      const matchesType =
        !this.filterType || p.type === this.filterType;

      return matchesSearch && matchesType;
    });
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterType = '';
    this.filterProducts();
  }

  // Stats
  getLowStockCount() { 
    return this.productList.filter(p => p.stockQty < 10).length; 
  }
  
  getProductTypes() { 
    return new Set(this.productList.map(p => p.type)).size; 
  }
  
  getStockStatus(qty: number) { 
    return qty < 10 ? 'Low' : qty < 50 ? 'Medium' : 'High'; 
  }

  get totalStockValue() {
    return this.productList.reduce((total, p) => {
      const price = p.type === 'fixed' ? p.price ?? 0 : p.pricePerKg ?? 0;
      return total + price * p.stockQty;
    }, 0);
  }

  getInStockCount() { 
    return this.productList.filter(p => p.stockQty > 0).length; 
  }

  // CSV export
  exportCSV() {
    const headers = ['ID','Barcode','Name','Type','Price','PricePerKg','StockQty'];
    const rows = this.productList.map(p => [
      p.id, p.barcode, p.name, p.type, p.price ?? '', p.pricePerKg ?? '', p.stockQty
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = 'product_report.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    
    this.showMessage('CSV exported successfully', 'success');
  }

  // Navigation methods
  goToBilling() {
    this.router.navigate(['/']);
  }

  goToReports() {
    this.router.navigate(['/reports']);
  }
}
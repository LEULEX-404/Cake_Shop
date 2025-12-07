import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

interface Product {
  id: number;
  barcode: string;
  name: string;
  type: string;
  price?: number;
  pricePerKg?: number;
  stockQty: number;
}

interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  amount: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products {
  barcode: string = '';
  qty: number = 1;
  product?: Product;
  message: string = '';

  productList: Product[] = [];
  invoiceItems: InvoiceItem[] = [];
  invoiceTotal: number = 0;

  constructor(private http: HttpClient) {
    this.loadAllProducts();
  }

  loadAllProducts() {
    this.http.get<Product[]>('http://localhost:5277/api/product')
      .subscribe({
        next: data => this.productList = data,
        error: err => console.error(err)
      });
  }

  searchProduct() {
    if (!this.barcode.trim()) return;
    // Clear previous product immediately
    this.product = undefined;
    this.message = '';

    this.http.get<Product>(`http://localhost:5277/api/product/barcode/${this.barcode}`)
      .subscribe({
        next: data => {
          this.product = data;
        },
        error: err => {
          this.product = undefined;
          this.message = 'Product not found';
        }
      });
  }

  addToInvoice() {
    if (!this.product) return;

    const price = this.product.type === 'fixed' ? this.product.price! : this.product.pricePerKg!;

    const existingItem = this.invoiceItems.find(item => item.name === this.product!.name);
    if (existingItem) {
      existingItem.qty += this.qty;
      existingItem.amount = existingItem.qty * existingItem.price;
    } else {
      const item: InvoiceItem = {
        name: this.product!.name,
        qty: this.qty,
        price: price,
        amount: this.qty * price
      };
      this.invoiceItems.push(item);
    }

    this.calculateInvoiceTotal();

    // Reset input
    this.qty = 1;
    this.barcode = '';
    this.product = undefined;

    this.message = 'Item added to invoice';
  }

  async generateBill() {
    if (this.invoiceItems.length === 0) {
      this.message = 'No items in invoice';
      return;
    }

    try {
      // Stock reduce for all items
      for (const item of this.invoiceItems) {
        const barcode = this.getBarcodeByName(item.name);
        if (!barcode) throw new Error(`Barcode not found for ${item.name}`);

        await firstValueFrom(this.http.post('http://localhost:5277/api/product/reduce', {
          barcode: barcode,
          qty: item.qty
        }));
      }

      // Store total before clearing invoice
      const totalAmount = this.invoiceTotal;

      // Auto clear invoice
      this.invoiceItems = [];
      this.invoiceTotal = 0;

      // Reset inputs
      this.barcode = '';
      this.qty = 1;
      this.product = undefined;

      // Display message with total
      this.message = `Bill generated successfully! Total: ${totalAmount} LKR`;

    } catch (err: any) {
      console.error(err);
      this.message = 'Error reducing stock';
    }
  }

  getBarcodeByName(name: string) {
    const product = this.productList.find(p => p.name === name);
    return product ? product.barcode : '';
  }

  calculateInvoiceTotal() {
    this.invoiceTotal = this.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  }

  clearInvoice() {
    this.invoiceItems = [];
    this.invoiceTotal = 0;
    this.message = '';
    this.barcode = '';
    this.qty = 1;
    this.product = undefined;
  }
}

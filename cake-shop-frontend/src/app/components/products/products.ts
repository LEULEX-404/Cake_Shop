import { Component, ChangeDetectorRef, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  barcode: string;
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
export class Products implements OnInit, OnDestroy {
  barcode: string = '';
  qty: number = 1;
  product?: Product;
  message: string = '';
  messageType: string = ''; // 'success' or 'error'
  isProcessing: boolean = false;

  productList: Product[] = [];
  invoiceItems: InvoiceItem[] = [];
  invoiceTotal: number = 0;

  // New properties for date/time
  currentDate: string = '';
  currentTime: string = '';
  private timeInterval: any;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadAllProducts();
  }

  ngOnInit(): void {
    // Only run in browser environment
    if (this.isBrowser) {
      // Initialize date and time
      this.updateDateTime();
      
      // Update time every second
      this.timeInterval = setInterval(() => {
        this.updateDateTime();
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    // Clear interval when component is destroyed
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Update current date and time
  updateDateTime(): void {
    if (!this.isBrowser) return;
    
    const now = new Date();
    
    // Format date: "Monday, Dec 7, 2025"
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    this.currentDate = now.toLocaleDateString('en-US', dateOptions);
    
    // Format time: "02:30:45 PM"
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    };
    this.currentTime = now.toLocaleTimeString('en-US', timeOptions);
    
    // Update DOM elements if they exist
    if (typeof document !== 'undefined') {
      const dateElement = document.getElementById('currentDate');
      const timeElement = document.getElementById('currentTime');
      
      if (dateElement) {
        dateElement.textContent = this.currentDate;
      }
      if (timeElement) {
        timeElement.textContent = this.currentTime;
      }
    }
  }

  loadAllProducts() {
    this.http.get<Product[]>('http://localhost:5277/api/product')
      .subscribe({
        next: data => this.productList = data,
        error: err => console.error(err)
      });
  }

  searchProduct() {
    if (!this.barcode.trim() || this.isProcessing) return;

    // Clear previous search immediately
    this.product = undefined;
    this.message = '';

    this.http.get<Product>(`http://localhost:5277/api/product/barcode/${this.barcode}`)
      .subscribe({
        next: data => {
          this.product = data;
          this.message = 'Product found successfully!';
          this.messageType = 'success';
          this.cdr.detectChanges(); // Force view update
        },
        error: err => {
          this.product = undefined;
          this.message = 'Product not found';
          this.messageType = 'error';
          this.cdr.detectChanges(); // Force view update
        }
      });
  }

  addToInvoice() {
    if (!this.product) {
      this.message = 'No product selected';
      this.messageType = 'error';
      return;
    }

    if (this.qty <= 0) {
      this.message = 'Quantity must be greater than 0';
      this.messageType = 'error';
      return;
    }

    if (this.qty > this.product.stockQty) {
      this.message = 'Insufficient stock available';
      this.messageType = 'error';
      return;
    }

    const price = this.product.type === 'fixed' ? this.product.price! : this.product.pricePerKg!;

    const existingItem = this.invoiceItems.find(item => item.barcode === this.product!.barcode);
    let item: InvoiceItem;
    if (existingItem) {
      existingItem.qty += this.qty;
      existingItem.amount = existingItem.qty * existingItem.price;
      item = existingItem;
    } else {
      item = {
        name: this.product!.name,
        barcode: this.product!.barcode,
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

    this.message = `${item.name} added to invoice`;
    this.messageType = 'success';

    // Clear message after 3 seconds
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  async generateBill() {
    if (this.invoiceItems.length === 0) {
      this.message = 'No items in invoice';
      this.messageType = 'error';
      return;
    }

    this.isProcessing = true;

    try {
      for (const item of this.invoiceItems) {
        // Reduce stock via API, using text response to avoid JSON parse error
        await firstValueFrom(this.http.post('http://localhost:5277/api/product/reduce',
          { barcode: item.barcode, qty: item.qty },
          { responseType: 'text' } 
        ));
      }

      // Store total before clearing invoice
      const totalAmount = this.invoiceTotal;

      // Clear invoice
      this.invoiceItems = [];
      this.invoiceTotal = 0;
      this.barcode = '';
      this.qty = 1;
      this.product = undefined;

      this.message = `Bill generated successfully! Total: ${totalAmount} LKR`;
      this.messageType = 'success';
      this.cdr.detectChanges();

      // Clear message after 3 seconds
      setTimeout(() => {
        this.message = '';
      }, 3000);

    } catch (err: any) {
      console.error(err);
      this.message = 'Error reducing stock';
      this.messageType = 'error';
      this.cdr.detectChanges();
    } finally {
      this.isProcessing = false;
    }
  }

  // Calculate total quantity of all items
  calculateTotalQty(): number {
    return this.invoiceItems.reduce((total, item) => total + item.qty, 0);
  }

  // Calculate invoice total (renamed from your original)
  calculateInvoiceTotal() {
    this.invoiceTotal = this.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  }

  // Generate unique invoice number
  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${year}${month}${day}-${random}`;
  }

  // Remove item from invoice
  removeItem(index: number): void {
    if (index >= 0 && index < this.invoiceItems.length) {
      const removedItem = this.invoiceItems[index];
      this.invoiceItems.splice(index, 1);
      this.calculateInvoiceTotal();
      
      this.message = `${removedItem.name} removed from invoice`;
      this.messageType = 'success';
      
      // Clear message after 3 seconds
      setTimeout(() => {
        this.message = '';
      }, 3000);
    }
  }

  clearInvoice() {
    this.invoiceItems = [];
    this.invoiceTotal = 0;
    this.message = 'Invoice cleared';
    this.messageType = 'success';
    this.barcode = '';
    this.qty = 1;
    this.product = undefined;

    // Clear message after 2 seconds
    setTimeout(() => {
      this.message = '';
    }, 2000);
  }
}
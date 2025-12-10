import { Component, ChangeDetectorRef, OnInit, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from "@angular/router";
import { ViewChild, ElementRef } from '@angular/core';



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
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit, OnDestroy {

  @ViewChild('paymentTypeRef') paymentTypeRef!: ElementRef;
  @ViewChild('paidAmountRef') paidAmountRef!: ElementRef;
  @ViewChild('confirmBtnRef') confirmBtnRef!: ElementRef;


  barcode: string = '';
  qty: number = 1;
  product?: Product;
  message: string = '';
  messageType: string = '';
  isProcessing: boolean = false;

  productList: Product[] = [];
  invoiceItems: InvoiceItem[] = [];
  invoiceTotal: number = 0;

  currentDate: string = '';
  currentTime: string = '';
  private timeInterval: any;
  private isBrowser: boolean;

  invoiceNumber: string = '';
  showPaymentModal: boolean = false;
  paymentType: 'cash' | 'card' | 'mixed' = 'cash';
  paidAmount: number | null = null;
  paymentError: string = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadAllProducts();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.updateDateTime();
      this.timeInterval = setInterval(() => this.updateDateTime(), 1000);
      
    }
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }

  updateDateTime(): void {
    if (!this.isBrowser) return;
    const now = new Date();
    this.currentDate = now.toLocaleDateString();
    this.currentTime = now.toLocaleTimeString();
    this.cdr.detectChanges();
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
    this.product = undefined;
    this.message = '';
    this.http.get<Product>(`http://localhost:5277/api/product/barcode/${this.barcode}`)
      .subscribe({
        next: data => { this.product = data; this.message='Product found'; this.messageType='success'; this.cdr.detectChanges(); },
        error: err => { this.product=undefined; this.message='Product not found'; this.messageType='error'; this.cdr.detectChanges(); }
      });
  }

  addToInvoice() {
    if (!this.product) { this.message='No product selected'; this.messageType='error'; return; }
    if (this.qty <=0 || this.qty>this.product.stockQty) { this.message='Invalid quantity'; this.messageType='error'; return; }

    const price = this.product.type==='fixed'?this.product.price!:this.product.pricePerKg!;
    const existing = this.invoiceItems.find(i=>i.barcode===this.product!.barcode);
    if (existing) { existing.qty+=this.qty; existing.amount=existing.qty*existing.price; }
    else this.invoiceItems.push({ name:this.product!.name, barcode:this.product!.barcode, qty:this.qty, price, amount:this.qty*price });

    this.calculateInvoiceTotal();
    this.qty=1; this.barcode=''; this.product=undefined;
  }

  openPaymentModal() {
    if(this.invoiceItems.length===0){ this.message='No items'; this.messageType='error'; return; }
    this.paymentType='cash'; this.paidAmount=null; this.paymentError=''; this.showPaymentModal=true;

    /** 🔥 GUARANTEED FIX */
  setTimeout(() => {
    if (this.paymentTypeRef) {
      this.paymentTypeRef.nativeElement.focus();
    }
  }, 150); // delay ensures modal fully appears
  }

  closePaymentModal() { this.showPaymentModal=false; this.paymentError=''; this.paidAmount=null; }

  computeChange(): number { const paid=this.paidAmount??0; return Math.max(0, Math.round((paid-this.invoiceTotal)*100)/100); }

  async confirmPayment() {
    this.paymentError = '';
    if(this.paidAmount === null || isNaN(this.paidAmount)) {
      this.paymentError = 'Enter valid paid amount';
      return;
    }
    if(this.paidAmount < this.invoiceTotal) {
      this.paymentError = 'Paid amount insufficient';
      return;
    }
  
    this.isProcessing = true;
  
    try {
      // 1️⃣ Reduce stock for each invoice item
      for(const item of this.invoiceItems) {
        await firstValueFrom(this.http.post(
          'http://localhost:5277/api/product/reduce',
          { barcode: item.barcode, qty: item.qty },
          { responseType: 'text' }
        ));
      }
  
      // 2️⃣ Build invoice payload matching backend C# model
      const invoicePayload = {
        date: new Date(),
        totalAmount: this.invoiceTotal,
        items: this.invoiceItems.map(i => {
          const product = this.productList.find(p => p.barcode === i.barcode);
          return {
            productId: product?.id,      // backend expects ProductId
            productName: i.name,         // backend expects ProductName
            qty: i.qty,                  // Qty
            unitPrice: i.price,           // UnitPrice
            amount: i.amount
          };
        })
      };
  
      // 3️⃣ Send invoice to backend
      await firstValueFrom(this.http.post(
        'http://localhost:5277/api/invoice/create',
        invoicePayload
      ));
  
      // 4️⃣ Print receipt
      const paid = this.paidAmount ?? this.invoiceTotal;
      const change = Math.round((paid - this.invoiceTotal) * 100) / 100;
      this.printReceipt({ ...invoicePayload, paid, change });
  
      // 5️⃣ Reset frontend: modal close, invoice clear, focus back to barcode
      this.clearInvoice();
      this.showPaymentModal = false;
      this.barcode = '';
      this.qty = 1;
      this.product = undefined;
      this.message = `Bill No: ${this.generateInvoiceNumber()} | Total: ${this.invoiceTotal} LKR | Change: ${change} LKR`;
      this.messageType = 'success';
      this.cdr.detectChanges();
  
      setTimeout(() => {
        this.message = '';
        document.getElementById('barcode')?.focus(); // immediately focus for next sale
      }, 4000);
  
    } catch(err) {
      console.error(err);
      this.paymentError = 'Payment error';
      this.message = 'Payment error';
      this.messageType = 'error';
      this.cdr.detectChanges();
    } finally {
      this.isProcessing = false;
    }
  }
  
  printReceipt(invoiceData: any) {
    const header = `<div style="text-align:center;font-family:monospace;">
                      <h2>Cake Shop</h2>
                      <div>${invoiceData.date}</div><hr/>
                    </div>`;
  
    let itemsHtml = '<table style="width:100%; font-family:monospace;"><tbody>';
  
    invoiceData.items.forEach((it: any) => {
      const amount = it.amount ?? (it.qty * (it.unitPrice ?? it.price ?? 0)); // fallback
      const price = it.price ?? it.unitPrice ?? 0;
      itemsHtml += `<tr>
                      <td>${it.name}</td>
                      <td>${it.qty} x ${price.toFixed(2)}</td>
                      <td style="text-align:right">${amount.toFixed(2)}</td>
                    </tr>`;
    });
  
    itemsHtml += '</tbody></table>';
  
    const total = invoiceData.totalAmount ?? 0;
    const paid = invoiceData.paid ?? total;
    const change = invoiceData.change ?? Math.max(0, paid - total);
  
    const totals = `<hr/>
                    <div>Total: ${total.toFixed(2)} Paid: ${paid.toFixed(2)} Change: ${change.toFixed(2)}</div>
                    <hr/>`;
  
    const printHtml = `<html><head><title>Receipt</title></head><body>${header}${itemsHtml}${totals}</body></html>`;
    const w = window.open('', '_blank', 'width=350,height=600'); 
    if (!w) { alert('Allow popups'); return; }
    w.document.write(printHtml); 
    w.document.close(); 
    w.focus(); 
    setTimeout(() => w.print(), 500);
  }
  

  calculateTotalQty(): number { return this.invoiceItems.reduce((sum,i)=>sum+i.qty,0); }
  calculateInvoiceTotal() { this.invoiceTotal=this.invoiceItems.reduce((sum,i)=>sum+i.amount,0); }
  generateInvoiceNumber(): string { const d=new Date(); return `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}-${Math.floor(Math.random()*10000)}`; }

  removeItem(index:number){ if(index>=0&&index<this.invoiceItems.length){ this.invoiceItems.splice(index,1); this.calculateInvoiceTotal(); } }
  clearInvoice(){ this.invoiceItems=[]; this.invoiceTotal=0; this.barcode=''; this.qty=1; this.product=undefined; }

  onBarcodeEnter(){ this.searchProduct(); setTimeout(()=>{ document.getElementById('qty')?.focus(); },50); }
  onBarcodeTab(e:KeyboardEvent){ 
    if(e.key==='Tab'){ 
      e.preventDefault(); 
      (document.querySelector(`[data-index="0"]`) as HTMLElement)?.focus(); 
    } 
  }
  onQtyEnter(){ this.addToInvoice(); setTimeout(()=>{ document.getElementById('barcode')?.focus(); },50); }
  onInvoiceRowKey(e:KeyboardEvent,index:number){ if(e.key==='Enter'){ this.openPaymentModal(); setTimeout(()=>{ document.getElementById('barcode')?.focus(); },50); }
    else if(e.key==='Delete'){ this.removeItem(index); }
    else if(e.key==='ArrowUp'&&index>0){ (document.querySelector(`[data-index="${index-1}"]`) as HTMLElement)?.focus(); }
    else if(e.key==='ArrowDown'&&index<this.invoiceItems.length-1){ (document.querySelector(`[data-index="${index+1}"]`) as HTMLElement)?.focus(); }
  }

  @HostListener('window:keydown',['$event'])
  handleGlobalShortcuts(e:KeyboardEvent){
    if (e.ctrlKey && e.key === 'c') { 
      this.clearInvoice(); 
      e.preventDefault(); 
    }
    else if (e.ctrlKey && e.key === 'g') { 
      this.openPaymentModal(); 
      e.preventDefault(); 
    }
    else if (e.key === 'F1') { 
      e.preventDefault();
      window.location.href = '/admin/products';   // or: this.router.navigate(['/admin']);
    }
  }


  focusPaidAmount() {
    setTimeout(() => {
      this.paidAmountRef?.nativeElement.focus();
    }, 50);
  }
  
  focusConfirmButton() {
    setTimeout(() => {
      this.confirmBtnRef?.nativeElement.focus();
    }, 50);
  }

  @HostListener('document:keydown', ['$event'])
  handleModalKeys(event: KeyboardEvent) {
  if (!this.showPaymentModal) return;

  // ESC closes modal
  if (event.key === 'Escape') {
    event.preventDefault();
    this.closePaymentModal();
  }

  // ENTER on confirm button triggers confirmPayment
  if (event.key === 'Enter' && document.activeElement === this.confirmBtnRef?.nativeElement) {
    event.preventDefault();
    this.confirmPayment();
  }
}

  
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Products } from './components/products/products';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, Products],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cake-shop-frontend');
}

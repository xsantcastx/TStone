import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DataService, Producto } from '../../core/services/data.service';
import { HomeHeroComponent } from '../../features/home/home-hero/home-hero.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, HomeHeroComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePageComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  
  // Fallback data for immediate display and SSR
  productos12mm: Producto[] = [
    { nombre: 'Saint Laurent', slug: 'saint-laurent', grosor: '12mm', medida: '160x320cm', cover: 'assets/productos/12mm/saint-laurent.jpg' },
    { nombre: 'Black Gold', slug: 'black-gold', grosor: '12mm', medida: '160x320cm', cover: 'assets/productos/12mm/black-gold.jpg' },
    { nombre: 'Arenaria Ivory', slug: 'arenaria-ivory', grosor: '12mm', medida: '160x320cm', cover: 'assets/productos/12mm/arenaria-ivory.jpg' },
    { nombre: 'Calacatta Gold', slug: 'calacatta-gold', grosor: '12mm', medida: '160x320cm', cover: 'assets/Detailed/image5.jpeg' }
  ];

  productos15mm: Producto[] = [
    { nombre: 'Statuario Elegance', slug: 'statuario-elegance', grosor: '15mm', medida: '160x320cm', cover: 'assets/productos/15mm/statuario-elegance.jpg' },
    { nombre: 'Laponia Black', slug: 'laponia-black', grosor: '15mm', medida: '160x320cm', cover: 'assets/Modern/image4.jpeg' },
    { nombre: 'Patagonia Natural', slug: 'patagonia-natural', grosor: '15mm', medida: '160x320cm', cover: 'assets/Modern/image5.jpeg' }
  ];

  productos20mm: Producto[] = [
    { nombre: 'Saint Laurent', slug: 'saint-laurent-20', grosor: '20mm', medida: '160x320cm', cover: 'assets/productos/20mm/saint-laurent.jpg' },
    { nombre: 'Black Gold', slug: 'black-gold-20', grosor: '20mm', medida: '160x320cm', cover: 'assets/Modern/image7.jpeg' },
    { nombre: 'Limestone Ivory', slug: 'limestone-ivory-20', grosor: '20mm', medida: '160x320cm', cover: 'assets/Modern/image8.jpeg' },
    { nombre: 'Crystal Clear', slug: 'crystal-clear-20', grosor: '20mm', medida: '160x320cm', cover: 'assets/Modern/image9.jpeg' }
  ];

  ngOnInit() {
    // Only load from service if in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.loadProductos();
    }
  }

  private loadProductos() {
    this.dataService.getProductos().subscribe({
      next: (data) => {
        // Update with real data when available
        const productos12 = this.dataService.getProductosByGrosor(data.items, '12mm');
        const productos15 = this.dataService.getProductosByGrosor(data.items, '15mm');
        const productos20 = this.dataService.getProductosByGrosor(data.items, '20mm');
        
        if (productos12.length > 0) this.productos12mm = productos12.slice(0, 4);
        if (productos15.length > 0) this.productos15mm = productos15.slice(0, 3);
        if (productos20.length > 0) this.productos20mm = productos20.slice(0, 4);
        
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.log('Using fallback product data');
        // Fallback data is already set in component initialization
        this.cdr.detectChanges();
      }
    });
  }
}

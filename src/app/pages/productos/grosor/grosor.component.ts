import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductsService } from '../../../services/products.service';
import { Product } from '../../../models/product';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-grosor',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <!-- Hero Section with matching background -->
    <section class="relative py-16 lg:py-24 bg-gradient-to-b from-ts-paper to-white overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-ts-bg/5 to-ts-accent/5"></div>
      <div class="relative max-w-7xl mx-auto px-6">
        <!-- Breadcrumb Navigation -->
        <nav class="mb-8">
          <ol class="flex items-center space-x-2 text-sm text-neutral-700">
            <li><a routerLink="/" class="hover:text-ts-accent transition-colors text-neutral-800">Home</a></li>
            <li class="text-neutral-500">/</li>
            <li><a routerLink="/productos" class="hover:text-ts-accent transition-colors text-neutral-800">Productos</a></li>
            <li class="text-neutral-500">/</li>
            <li class="text-ts-accent font-medium">{{grosor}}</li>
          </ol>
        </nav>
        
        <!-- Header Content -->
        <div class="text-center">
          <h1 class="font-serif text-4xl lg:text-6xl text-neutral-800 mb-6 leading-tight">
            Colección <span class="text-ts-accent">{{grosor}}</span>
          </h1>
          <p class="text-xl lg:text-2xl text-neutral-700 max-w-3xl mx-auto leading-relaxed mb-8">
            Superficies porcelánicas de gran formato {{medidaInfo}} perfectas para 
            {{aplicacionesInfo}}
          </p>
          
          <!-- Results Info -->
          <div class="flex items-center justify-center gap-4 text-neutral-700">
            <div class="w-16 h-px bg-ts-accent"></div>
            <span class="text-sm font-medium tracking-wider uppercase">
              {{productosFiltrados.length}} producto{{productosFiltrados.length !== 1 ? 's' : ''}} disponible{{productosFiltrados.length !== 1 ? 's' : ''}}
            </span>
            <div class="w-16 h-px bg-ts-accent"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Navigation and Content Section -->
    <section class="bg-white min-h-screen">
      <div class="max-w-7xl mx-auto px-6 py-16">
        
        <!-- Controls Section -->
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-12">
          
          <!-- Thickness Navigation Tabs -->
          <div class="bg-gradient-to-r from-ts-paper to-white rounded-2xl p-6 shadow-sm flex-1">
            <h3 class="text-lg font-medium text-neutral-800 mb-4">Explorar por grosor</h3>
            <div class="flex gap-2 overflow-x-auto pb-2">
              <a routerLink="/productos/12mm" 
                 [class.bg-ts-accent]="grosor === '12mm'"
                 [class.text-black]="grosor === '12mm'"
                 [class.bg-white]="grosor !== '12mm'"
                 [class.border-ts-accent]="grosor !== '12mm'"
                 [class.text-neutral-700]="grosor !== '12mm'"
                 class="px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all duration-300 border hover:bg-ts-accent hover:text-black hover:border-ts-accent">
                12mm (162×324cm)
              </a>
              <a routerLink="/productos/20mm" 
                 [class.bg-ts-accent]="grosor === '20mm'"
                 [class.text-black]="grosor === '20mm'"
                 [class.bg-white]="grosor !== '20mm'"
                 [class.border-ts-accent]="grosor !== '20mm'"
                 [class.text-neutral-700]="grosor !== '20mm'"
                 class="px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all duration-300 border hover:bg-ts-accent hover:text-black hover:border-ts-accent">
                20mm (162×324cm)
              </a>
            </div>
          </div>

          <!-- View Mode Controls -->
          <div class="bg-gradient-to-r from-ts-paper to-white rounded-2xl p-6 shadow-sm">
            <h3 class="text-lg font-medium text-neutral-800 mb-4 text-center">Vista</h3>
            <div class="flex bg-white border border-ts-accent/20 rounded-full p-1">
              <button 
                [class.bg-ts-accent]="viewMode === 'grid'"
                [class.text-black]="viewMode === 'grid'"
                [class.shadow-sm]="viewMode === 'grid'"
                [class.text-neutral-700]="viewMode !== 'grid'"
                (click)="viewMode = 'grid'"
                class="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300">
                Grid
              </button>
              <button 
                [class.bg-ts-accent]="viewMode === 'list'"
                [class.text-black]="viewMode === 'list'"
                [class.shadow-sm]="viewMode === 'list'"
                [class.text-neutral-700]="viewMode !== 'list'"
                (click)="viewMode = 'list'"
                class="px-6 py-2 rounded-full text-sm font-medium transition-all duration-300">
                Lista
              </button>
            </div>
          </div>
        </div>


      <!-- Products Grid -->
      <div *ngIf="isLoading" class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="animate-pulse">
          <div class="bg-neutral-200 aspect-square rounded-2xl mb-4"></div>
          <div class="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
          <div class="h-3 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>

      <div [class]="viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8' : 'space-y-6'"
           *ngIf="!isLoading && productosFiltrados.length > 0">
        <ts-product-card 
          *ngFor="let producto of productosFiltrados" 
          [product]="producto"
          [viewMode]="viewMode"
          [grosorPath]="grosor"
          [showPromotionBadge]="true">
        </ts-product-card>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="!isLoading && productosFiltrados.length === 0" class="text-center py-16">
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg class="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
        </div>
        <h3 class="font-serif text-2xl text-neutral-800 mb-2">No hay productos disponibles</h3>
        <p class="text-neutral-600 mb-6">
          Actualmente no tenemos productos disponibles para el grosor {{grosor}}.
        </p>
        <a routerLink="/productos" 
           class="inline-block px-6 py-3 bg-ts-accent text-black rounded-full font-semibold hover:bg-ts-accent/90 transition-colors">
          Ver todos los productos
        </a>
      </div>
      
      <!-- Call to Action Section -->
      <div class="mt-20 text-center py-16 bg-gradient-to-r from-ts-paper to-white rounded-2xl">
        <div class="max-w-3xl mx-auto">
          <h2 class="font-serif text-3xl text-neutral-800 mb-4">
            ¿Necesitas más información?
          </h2>
          <p class="text-lg text-neutral-600 mb-8">
            Descarga nuestros datos técnicos o contacta con nuestro equipo para asesoramiento personalizado.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/datos-tecnicos" 
               class="inline-flex items-center gap-2 px-8 py-4 bg-ts-accent text-black rounded-full font-semibold hover:bg-ts-accent/90 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/>
              </svg>
              Datos técnicos
            </a>
            <a routerLink="/contacto" 
               class="inline-flex items-center gap-2 px-8 py-4 ring-2 ring-ts-accent text-ts-accent hover:bg-ts-accent hover:text-black rounded-full font-semibold transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-3.793-.793L3 21l1.793-6.207A8.955 8.955 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z"/>
              </svg>
              Contacto
            </a>
          </div>
        </div>
      </div>
    </div>
    </section>
  `
})
export class GrosorComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private productsService = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);
  
  grosor = '';
  productosFiltrados: Product[] = [];
  viewMode: 'grid' | 'list' = 'grid';
  isLoading = true;

  ngOnInit() {
    // Watch for route parameter changes to reload products when switching grosor
    this.route.paramMap.subscribe(params => {
      this.grosor = params.get('grosor') || '';
      
      // Load real products from Firestore
      if (isPlatformBrowser(this.platformId)) {
        this.loadProducts();
      }
    });
  }

  private loadProducts() {
    this.isLoading = true;
    this.productsService.getProductsByGrosor(this.grosor).subscribe({
      next: (products) => {
        // Filter only published and active products
        this.productosFiltrados = products
          .filter(p => p.status === 'published' && p.active !== false)
          .sort((a, b) => a.name.localeCompare(b.name));
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.productosFiltrados = [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Force change detection
      }
    });
  }

  get medidaInfo(): string {
    return '162×324cm';
  }

  get aplicacionesInfo(): string {
    switch (this.grosor) {
      case '12mm': return 'revestimientos interiores y exteriores';
      case '20mm': return 'pavimentos exteriores y aplicaciones de alto tránsito';
      default: return 'múltiples aplicaciones';
    }
  }

  getAplicaciones(grosor: string): string {
    switch (grosor) {
      case '12mm': return 'cocinas y baños residenciales';
      case '20mm': return 'exteriores y zonas de alto tránsito';
      default: return 'diversos proyectos';
    }
  }
}
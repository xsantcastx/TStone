import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ProductsService } from '../../services/products.service';
import { MediaService } from '../../services/media.service';
import { CategoryService } from '../../services/category.service';
import { MaterialService } from '../../services/material.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product';
import { Category, Material } from '../../models/catalog';
import { Media } from '../../models/media';
import { CatalogDownloadComponent } from '../../shared/components/catalog-download/catalog-download.component';

@Component({
  selector: 'app-productos-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, CatalogDownloadComponent],
  templateUrl: './productos.page.html',
  styleUrl: './productos.page.scss'
})
export class ProductosPageComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private productsService = inject(ProductsService);
  private mediaService = inject(MediaService);
  private categoryService = inject(CategoryService);
  private materialService = inject(MaterialService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  
  // Firestore products
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  
  // Products by thickness for display
  productos12mm: Product[] = [];
  productos15mm: Product[] = [];
  productos20mm: Product[] = [];
  
  // Filter options
  categories: Category[] = [];
  materials: Material[] = [];
  selectedCategoryId = '';
  selectedMaterialId = '';
  searchTerm = '';
  
  // Loading state
  isLoading = true;

  async ngOnInit() {
    // Load filter options and products in parallel
    if (isPlatformBrowser(this.platformId)) {
      console.log('🚀 Productos page initializing...');
      await Promise.all([
        this.loadFilterOptions(),
        this.loadProducts()
      ]);
      console.log('✅ Productos page initialization complete');
    }
  }

  private async loadFilterOptions() {
    try {
      console.log('📋 Loading filter options...');
      // Load categories and materials in parallel
      const [categories, materials] = await Promise.all([
        new Promise<Category[]>((resolve) => {
          this.categoryService.getActiveCategories().subscribe({
            next: (cats) => {
              console.log('✅ Categories loaded:', cats.length, cats);
              resolve(cats);
            },
            error: (err) => {
              console.error('❌ Error loading categories:', err);
              resolve([]);
            }
          });
        }),
        new Promise<Material[]>((resolve) => {
          this.materialService.getActiveMaterials().subscribe({
            next: (mats) => {
              console.log('✅ Materials loaded:', mats.length, mats);
              resolve(mats);
            },
            error: (err) => {
              console.error('❌ Error loading materials:', err);
              resolve([]);
            }
          });
        })
      ]);

      this.categories = categories;
      this.materials = materials;
      console.log('📊 Filter options ready - Categories:', this.categories.length, 'Materials:', this.materials.length);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  private async loadProducts() {
    this.isLoading = true;
    this.cdr.detectChanges(); // Force initial loading state

    try {
      // Get all published products from Firestore
      this.productsService.getAllProducts().subscribe({
        next: async (products) => {
          console.log('Products loaded from Firestore:', products.length);
          
          // Filter only published products
          const publishedProducts = products.filter(p => p.status === 'published');
          console.log('Published products:', publishedProducts.length);
          
          // Load cover images from media
          this.allProducts = await this.loadProductCovers(publishedProducts);
          console.log('Products with covers loaded:', this.allProducts.length);
          
          // Apply filters
          this.applyFilters();
          
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection after products load
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection on error
        }
      });
    } catch (error) {
      console.error('Error in loadProducts:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadProductCovers(products: Product[]): Promise<Product[]> {
    const productsWithCovers = await Promise.all(
      products.map(async (product) => {
        if (product.coverImage) {
          try {
            // Check if coverImage is a media ID or a URL
            const isMediaId = !product.coverImage.includes('http');
            
            if (isMediaId) {
              const media = await this.mediaService.getMediaById(product.coverImage);
              if (media) {
                return { ...product, imageUrl: media.url };
              }
            } else {
              // Already a URL (legacy products)
              return { ...product, imageUrl: product.coverImage };
            }
          } catch (error) {
            console.error('Error loading cover for product:', product.name, error);
          }
        }
        
        // No cover image or error loading it
        return { ...product, imageUrl: '' };
      })
    );

    return productsWithCovers;
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    // Filter by category
    if (this.selectedCategoryId) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategoryId);
    }

    // Filter by material
    if (this.selectedMaterialId) {
      filtered = filtered.filter(p => p.materialId === this.selectedMaterialId);
    }

    // Filter by search term (search in name and slug)
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        (p.search_name && p.search_name.includes(term))
      );
    }

    this.filteredProducts = filtered;
    
    // Group by thickness
    this.productos12mm = filtered.filter(p => p.grosor === '12mm' || p.specs?.grosor === '12mm');
    this.productos15mm = filtered.filter(p => p.grosor === '15mm' || p.specs?.grosor === '15mm');
    this.productos20mm = filtered.filter(p => p.grosor === '20mm' || p.specs?.grosor === '20mm');
    
    console.log('Filter applied - 12mm:', this.productos12mm.length, '15mm:', this.productos15mm.length, '20mm:', this.productos20mm.length);
    
    // Force change detection after filtering
    this.cdr.detectChanges();
  }

  onCategoryChange() {
    this.applyFilters();
  }

  onMaterialChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedCategoryId = '';
    this.selectedMaterialId = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  addToCart(product: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.cartService.add(product, 1);
  }

  get hasFilters(): boolean {
    return !!(this.selectedCategoryId || this.selectedMaterialId || this.searchTerm);
  }

  get totalProductsCount(): number {
    return this.allProducts.length;
  }

  get filteredProductsCount(): number {
    return this.filteredProducts.length;
  }
}

import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Title, Meta } from '@angular/platform-browser';
import { ProductsService } from '../../../services/products.service';
import { MediaService } from '../../../services/media.service';
import { CartService } from '../../../services/cart.service';
import { Product, TranslatedTextMap } from '../../../models/product';
import { Media } from '../../../models/media';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox/image-lightbox.component';
import { firstValueFrom, Subscription } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ImageLightboxComponent],
  templateUrl: './detalle.component.html'
})
export class DetalleComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private productsService = inject(ProductsService);
  private mediaService = inject(MediaService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private cdr = inject(ChangeDetectorRef);
  private languageService = inject(LanguageService);
  private languageSub?: Subscription;
  
  producto: Product | undefined;
  productosRelacionados: Product[] = [];
  coverImage: Media | undefined;
  galleryImages: Media[] = [];
  grosor = '';
  loading = true;
  lightboxOpen = false;
  currentLightboxImage = '';
  currentLightboxAlt = '';
  localizedDescription = '';

  async ngOnInit() {
    this.grosor = this.route.snapshot.paramMap.get('grosor') || '';
    const slug = this.route.snapshot.paramMap.get('slug');
    
    if (slug) {
      await this.loadProducto(slug);
    } else {
      this.loading = false;
    }
    
    this.languageSub = this.languageService.lang$.subscribe(() => {
      if (this.producto) {
        this.localizedDescription = this.getLocalizedText(this.producto.descriptionTranslations, this.producto.description || '');
        this.updateSEO();
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.languageSub?.unsubscribe();
  }

  private async loadProducto(slug: string) {
    // Only load from service if in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Query product by slug and grosor
        const products = await firstValueFrom(this.productsService.getAllProducts());
        
        // Find product matching slug and grosor, filter by published status
        this.producto = products.find(p => 
          p.slug === slug && 
          p.grosor === this.grosor &&
          p.status === 'published'
        );
        
        if (this.producto) {
          this.localizedDescription = this.getLocalizedText(this.producto.descriptionTranslations, this.producto.description || '');
          // Load cover image
          if (this.producto.coverImage) {
            const isMediaId = !this.producto.coverImage.includes('http');
            if (isMediaId) {
              const media = await this.mediaService.getMediaById(this.producto.coverImage);
              this.coverImage = media || undefined;
            }
          }
          
          // Load gallery images
          if (this.producto.galleryImageIds && this.producto.galleryImageIds.length > 0) {
          this.galleryImages = await this.mediaService.getMediaByIds(this.producto.galleryImageIds);
          }
          
          // Update page title and meta tags
          this.updateSEO();
          
          // Load related products
          await this.loadProductosRelacionados(products);
        } else {
          // Product not found or not published - redirect to 404
          this.router.navigate(['/404']);
        }
        
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      } catch (error) {
        console.error('Error loading product:', error);
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
        this.router.navigate(['/404']);
      }
    } else {
      // Basic SSR fallback
      this.loading = false;
    }
  }

  private async loadProductosRelacionados(todosLosProductos: Product[]) {
    if (!this.producto) return;
    
    // Get other published products from the same thickness and category
    let related = todosLosProductos
      .filter(p => 
        p.status === 'published' &&
        p.grosor === this.producto!.grosor && 
        p.id !== this.producto!.id &&
        p.categoryId === this.producto!.categoryId
      )
      .slice(0, 3);
    
    // If not enough from same category, fill with same thickness
    if (related.length < 3) {
      const additional = todosLosProductos
        .filter(p => 
          p.status === 'published' &&
          p.grosor === this.producto!.grosor && 
          p.id !== this.producto!.id &&
          !related.find(r => r.id === p.id)
        )
        .slice(0, 3 - related.length);
      
      related = [...related, ...additional];
    }
    
    // Load cover images for related products
    this.productosRelacionados = await Promise.all(
      related.map(async (product) => {
        if (product.coverImage) {
          const isMediaId = !product.coverImage.includes('http');
          if (isMediaId) {
            const media = await this.mediaService.getMediaById(product.coverImage);
            if (media) {
              return { ...product, imageUrl: media.url };
            }
          } else {
            return { ...product, imageUrl: product.coverImage };
          }
        }
        return product;
      })
    );
  }

  private updateSEO() {
    if (!this.producto) return;
    
    const defaultTitle = this.producto.seo?.title || `${this.producto.name} - TopStone`;
    const localizedTitle = this.getLocalizedText(this.producto.seoTitleTranslations, defaultTitle);
    this.titleService.setTitle(localizedTitle);
    
    const fallbackDescription = this.producto.seo?.metaDescription || this.producto.description || '';
    const localizedMeta = this.getLocalizedText(this.producto.seoMetaTranslations, this.localizedDescription || fallbackDescription);
    const ogDescription = localizedMeta || fallbackDescription;
    this.metaService.updateTag({ name: 'description', content: ogDescription });
    this.metaService.updateTag({ property: 'og:title', content: localizedTitle });
    this.metaService.updateTag({ property: 'og:description', content: ogDescription });
    
    if (this.coverImage?.url) {
      this.metaService.updateTag({ property: 'og:image', content: this.coverImage.url });
    }
  }

  private getLocalizedText(translations?: TranslatedTextMap, fallback: string = ''): string {
    if (!translations) {
      return fallback;
    }
    const currentLang = this.languageService.getCurrentLanguage();
    const direct = translations[currentLang as keyof typeof translations];
    if (direct && direct.trim().length > 0) {
      return direct.trim();
    }
    for (const lang of this.languageService.languages) {
      const value = translations[lang.code as keyof typeof translations];
      if (value && value.trim().length > 0) {
        return value.trim();
      }
    }
    return fallback;
  }

  goBack() {
    if (this.grosor) {
      this.router.navigate(['/productos', this.grosor]);
    } else {
      this.router.navigate(['/productos']);
    }
  }

  openLightbox(imageUrl?: string, altText?: string) {
    this.currentLightboxImage = imageUrl || this.coverImage?.url || '';
    this.currentLightboxAlt = altText || this.producto?.name || '';
    this.lightboxOpen = true;
  }

  addToCart() {
    if (!this.producto) return;
    
    this.cartService.add(this.producto, 1);
  }
}

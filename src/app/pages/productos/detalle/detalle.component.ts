import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProductsService } from '../../../services/products.service';
import { MaterialOptionService } from '../../../services/material-option.service';
import { MediaService } from '../../../services/media.service';
import { CartService } from '../../../services/cart.service';
import { Product, TranslatedTextMap } from '../../../models/product';
import { Media } from '../../../models/media';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox/image-lightbox.component';
import { firstValueFrom, Subscription } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';

const DEFAULT_VIDEO_ASPECT = 16 / 9;

interface VideoItem {
  kind: 'file' | 'embed';
  src: string;
  embedUrl?: SafeResourceUrl;
  thumbUrl?: string; // poster for the gallery strip (YouTube only; files use their first frame)
  title?: string;
  aspect: number; // width / height
}

/** One entry in the product gallery: a photo or a video */
type GallerySlide = { kind: 'image'; media: Media } | { kind: 'video'; video: VideoItem };

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
  private sanitizer = inject(DomSanitizer);
  private materialOptionService = inject(MaterialOptionService);
  private languageService = inject(LanguageService);
  private languageSub?: Subscription;
  
  producto: Product | undefined;
  productosRelacionados: Product[] = [];
  previousProduct: Product | undefined;
  nextProduct: Product | undefined;
  coverImage: Media | undefined;
  galleryImages: Media[] = [];
  slides: GallerySlide[] = [];
  currentSlideIndex = 0;
  grosor = '';
  loading = true;
  lightboxOpen = false;
  currentLightboxImage = '';
  currentLightboxAlt = '';
  localizedDescription = '';
  materialOptionNames: string[] = [];
  videoItems: VideoItem[] = [];

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
          this.videoItems = this.buildVideoItems(this.producto);
          this.materialOptionNames = await this.materialOptionService.namesFor(this.producto);
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
          
          // Gallery slides: cover + gallery photos, then videos
          const images = [...(this.coverImage ? [this.coverImage] : []), ...this.galleryImages];
          this.slides = [
            ...images.map(media => ({ kind: 'image' as const, media })),
            ...this.videoItems.map(video => ({ kind: 'video' as const, video }))
          ];
          this.currentSlideIndex = 0;
          
          // Update page title and meta tags
          this.updateSEO();
          
          // Load related products and navigation
          await this.loadProductosRelacionados(products);
          await this.loadProductNavigation(products);
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

  private buildVideoItems(product: Product): VideoItem[] {
    const items: VideoItem[] = [];
    for (const v of product.videos || []) {
      if (!v?.url) continue;
      if (v.type === 'upload') {
        items.push({ kind: 'file', src: v.url, title: v.title, aspect: DEFAULT_VIDEO_ASPECT });
        continue;
      }
      const embed = this.toEmbedUrl(v.url);
      if (embed) {
        // Only known hosts (YouTube/Vimeo) are trusted for the iframe
        // YouTube Shorts are vertical; other embeds don't expose their size, so assume 16:9
        const aspect = /youtube\.com\/shorts\//i.test(v.url) ? 9 / 16 : DEFAULT_VIDEO_ASPECT;
        const youtubeId = embed.match(/youtube\.com\/embed\/([\w-]+)/)?.[1];
        const thumbUrl = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : undefined;
        items.push({ kind: 'embed', src: embed, embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(embed), thumbUrl, title: v.title, aspect });
      } else if (/^https?:\/\//i.test(v.url)) {
        items.push({ kind: 'file', src: v.url, title: v.title, aspect: DEFAULT_VIDEO_ASPECT });
      }
    }
    return items;
  }

  /** Use the file's real dimensions once known, so vertical and horizontal videos keep their shape */
  onVideoMetadata(video: VideoItem, event: Event): void {
    const el = event.target as HTMLVideoElement;
    if (el.videoWidth && el.videoHeight) {
      video.aspect = el.videoWidth / el.videoHeight;
    }
  }

  private toEmbedUrl(raw: string): string | null {
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        const id = u.pathname.slice(1).split('/')[0];
        return /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        let id = u.searchParams.get('v');
        const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
        if (!id && m) id = m[1];
        return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const m = u.pathname.match(/(\d{5,})/);
        return m ? `https://player.vimeo.com/video/${m[1]}` : null;
      }
    } catch { /* invalid URL */ }
    return null;
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

  private async loadProductNavigation(todosLosProductos: Product[]) {
    if (!this.producto) return;
    
    // Get all published products from the same thickness, sorted by name
    const sameThickness = todosLosProductos
      .filter(p => 
        p.status === 'published' &&
        p.grosor === this.producto!.grosor
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Find current product index
    const currentIndex = sameThickness.findIndex(p => p.id === this.producto!.id);
    
    if (currentIndex === -1) return;
    
    // Get previous product (circular - wraps to last if at beginning)
    const prevIndex = currentIndex === 0 ? sameThickness.length - 1 : currentIndex - 1;
    const prevProduct = sameThickness[prevIndex];
    
    // Get next product (circular - wraps to first if at end)
    const nextIndex = currentIndex === sameThickness.length - 1 ? 0 : currentIndex + 1;
    const nextProduct = sameThickness[nextIndex];
    
    // Load cover images for navigation products
    if (prevProduct) {
      this.previousProduct = await this.loadProductImage(prevProduct);
    }
    if (nextProduct) {
      this.nextProduct = await this.loadProductImage(nextProduct);
    }
  }

  private async loadProductImage(product: Product): Promise<Product> {
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

  getMediaAlt(media?: Media | null, fallback: string = ''): string {
    if (!media) {
      return fallback;
    }
    return this.getLocalizedText(media.altTextTranslations, media.altText || fallback);
  }

  goBack() {
    if (this.grosor) {
      this.router.navigate(['/productos', this.grosor]);
    } else {
      this.router.navigate(['/productos']);
    }
  }

  openLightbox(media?: Media | null, fallbackAlt?: string) {
    const target = media || this.coverImage;
    this.currentLightboxImage = target?.url || '';
    const altFallback = fallbackAlt || this.producto?.name || '';
    this.currentLightboxAlt = this.getMediaAlt(target, altFallback);
    this.lightboxOpen = !!this.currentLightboxImage;
  }

  get currentSlide(): GallerySlide | undefined {
    return this.slides[this.currentSlideIndex];
  }

  selectSlide(index: number) {
    if (index >= 0 && index < this.slides.length) this.currentSlideIndex = index;
  }

  nextGalleryImage() {
    if (this.slides.length <= 1) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
  }

  previousGalleryImage() {
    if (this.slides.length <= 1) return;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
  }

  addToCart() {
    if (!this.producto) return;
    
    this.cartService.add(this.producto, 1);
  }

  openSpecialOffersContact() {
    // Navigate to contact page with special offers pre-filled
    this.router.navigate(['/contacto'], {
      queryParams: {
        subject: 'Consulta sobre ofertas y promociones especiales',
        product: this.producto?.name || ''
      }
    });
  }
}

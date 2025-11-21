import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore, collection, query, where, getDocs, QueryDocumentSnapshot } from '@angular/fire/firestore';
import { Media } from '../../models/media';

interface Tag {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
  active: boolean;
}

@Component({
  selector: 'app-galeria-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './galeria.page.html',
  styleUrl: './galeria.page.scss'
})
export class GaleriaPageComponent implements OnInit, OnDestroy {
  categoriaActiva = 'todos';
  
  // Instagram-style properties
  allImages: Media[] = [];
  filteredImages: Media[] = [];
  displayedImages: Media[] = [];
  imagesPerPage = 15;
  currentPage = 0;
  hasMoreImages = true;
  isLoadingMore = false;
  isLoading = true;
  
  // Scroll optimization
  private scrollTimeout: any;
  private lastScrollTime = 0;
  private scrollThrottle = 150; // ms
  
  // Lightbox for single image
  selectedImage: Media | null = null;
  selectedImageIndex = 0;
  
  // Hero carousel properties
  heroSlides: Media[] = [];
  currentSlideIndex = 0;
  private carouselInterval: any;
  showCarouselOverlay = true;
  private overlayTimeout: any;
  
  // Available tags
  availableTags: Tag[] = [];
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private firestore: Firestore
  ) {}

  ngOnInit() {
    if (this.isBrowser) {
      this.loadGaleriaFromFirebase();
    } else {
      this.isLoading = false;
    }
  }

  private async loadGaleriaFromFirebase() {
    try {
      const mediaQuery = query(
        collection(this.firestore, 'media'),
        where('relatedEntityType', '==', 'gallery')
      );
      
      const snapshot = await getDocs(mediaQuery);
      const mediaItems: Media[] = snapshot.docs
        .map((doc: QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data() as Omit<Media, 'id'>
        }))
        .sort((a, b) => {
          const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : (a.uploadedAt as any).toDate();
          const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : (b.uploadedAt as any).toDate();
          return dateB.getTime() - dateA.getTime();
        });
      
      console.log('📸 Gallery loaded from Firestore:', mediaItems.length, 'images');
      
      this.allImages = mediaItems;
      this.heroSlides = mediaItems.slice(0, 5);
      
      // Extract available tags from images
      const tagSet = new Set<string>();
      mediaItems.forEach(img => {
        if (img.tags && img.tags.length > 0) {
          img.tags.forEach(tag => tagSet.add(tag));
        }
      });
      
      this.availableTags = Array.from(tagSet).map(slug => ({
        slug,
        name: this.getTagDisplayName(slug),
        active: true
      }));
      
      this.filtrarPorCategoria('todos');
      this.startCarousel();
      this.isLoading = false;
      
      // Auto-hide overlay after 5 seconds
      this.startOverlayTimeout();
      
      this.cdr.detectChanges(); // Force change detection
    } catch (error) {
      console.error('❌ Error loading gallery from Firebase:', error);
      this.allImages = [];
      this.isLoading = false;
      this.cdr.detectChanges(); // Force change detection
    }
  }
  
  private startOverlayTimeout() {
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
    }
    this.overlayTimeout = setTimeout(() => {
      this.showCarouselOverlay = false;
      this.cdr.detectChanges();
    }, 5000);
  }

  private getTagDisplayName(slug: string): string {
    const tagMap: Record<string, string> = {
      'kitchen': 'Cocinas',
      'bathroom': 'Baños',
      'facade': 'Fachadas',
      'industrial': 'Industria',
      'other': 'Otros'
    };
    return tagMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  startCarousel(): void {
    if (!this.isBrowser) return;
    
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide(): void {
    if (this.heroSlides.length === 0) return;
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.heroSlides.length;
  }

  prevSlide(): void {
    if (this.heroSlides.length === 0) return;
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.heroSlides.length) % this.heroSlides.length;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  getAvailableTags(): Tag[] {
    return this.availableTags.filter(tag => tag.active);
  }

  filtrarPorCategoria(tagSlug: string) {
    this.categoriaActiva = tagSlug;
    
    if (tagSlug === 'todos') {
      this.filteredImages = [...this.allImages];
    } else {
      this.filteredImages = this.allImages.filter(image => 
        image.tags && image.tags.includes(tagSlug)
      );
    }
    
    this.currentPage = 0;
    this.displayedImages = [];
    this.hasMoreImages = true;
    this.loadMoreImages();
    
    if (this.selectedImage) {
      this.cerrarModal();
    }
  }

  loadMoreImages() {
    if (this.isLoadingMore || !this.hasMoreImages) return;
    
    this.isLoadingMore = true;
    
    setTimeout(() => {
      const startIndex = this.currentPage * this.imagesPerPage;
      const endIndex = startIndex + this.imagesPerPage;
      const newImages = this.filteredImages.slice(startIndex, endIndex);
      
      this.displayedImages = [...this.displayedImages, ...newImages];
      this.currentPage++;
      this.hasMoreImages = endIndex < this.filteredImages.length;
      this.isLoadingMore = false;
      
      console.log('[Gallery] Loaded page', this.currentPage, '- Total displayed:', this.displayedImages.length);
    }, 300);
  }

  @HostListener('window:scroll')
  onScroll() {
    if (!this.isBrowser) return;
    
    const now = Date.now();
    if (now - this.lastScrollTime < this.scrollThrottle) {
      if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => this.checkScrollPosition(), this.scrollThrottle);
      return;
    }
    
    this.lastScrollTime = now;
    this.checkScrollPosition();
  }

  private checkScrollPosition() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 800;
    
    if (scrollPosition >= threshold && !this.isLoadingMore && this.hasMoreImages) {
      this.loadMoreImages();
    }
  }

  getImageCountByTag(tagSlug: string): number {
    if (tagSlug === 'todos') {
      return this.allImages.length;
    }
    return this.allImages.filter(image => image.tags && image.tags.includes(tagSlug)).length;
  }

  abrirImagen(image: Media, index: number) {
    this.selectedImage = image;
    this.selectedImageIndex = index;
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  cerrarModal() {
    this.selectedImage = null;
    this.selectedImageIndex = 0;
    
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  anteriorImagen() {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
      this.selectedImage = this.displayedImages[this.selectedImageIndex];
    }
  }

  siguienteImagen() {
    if (this.selectedImageIndex < this.displayedImages.length - 1) {
      this.selectedImageIndex++;
      this.selectedImage = this.displayedImages[this.selectedImageIndex];
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.selectedImage) return;
    
    switch (event.key) {
      case 'Escape':
        this.cerrarModal();
        break;
      case 'ArrowLeft':
        this.anteriorImagen();
        break;
      case 'ArrowRight':
        this.siguienteImagen();
        break;
    }
  }

  getTotalImages(): number {
    return this.filteredImages.length;
  }

  ngOnDestroy() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
    }
  }
}

import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore, collection, query, where, getDocs, limit, orderBy } from '@angular/fire/firestore';
import { Product } from '../../models/product';
import { Media } from '../../models/media';
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
  private firestore = inject(Firestore);
  private cdr = inject(ChangeDetectorRef);
  
  isLoading = false;
  productos12mm: Product[] = [];
  productos15mm: Product[] = [];
  productos20mm: Product[] = [];
  
  galleryImage1: Media | null = null;
  galleryImage2: Media | null = null;

  ngOnInit() {
    // Only load from service if in browser (not during SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.loadProductos();
      this.loadGalleryImages();
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async loadProductos() {
    this.isLoading = true;
    
    try {
      const productsRef = collection(this.firestore, 'products');
      
      // Load 12mm products (get more than needed, then randomize and limit)
      const q12mm = query(
        productsRef,
        where('grosor', '==', '12mm'),
        where('status', '==', 'published'),
        where('active', '==', true),
        orderBy('name')
      );
      const snapshot12mm = await getDocs(q12mm);
      const all12mm = snapshot12mm.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      this.productos12mm = this.shuffleArray(all12mm).slice(0, 4);
      
      // Load 15mm products (get all, then randomize and limit)
      const q15mm = query(
        productsRef,
        where('grosor', '==', '15mm'),
        where('status', '==', 'published'),
        where('active', '==', true),
        orderBy('name')
      );
      const snapshot15mm = await getDocs(q15mm);
      const all15mm = snapshot15mm.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      this.productos15mm = this.shuffleArray(all15mm).slice(0, 3);
      
      // Load 20mm products (get all, then randomize and limit)
      const q20mm = query(
        productsRef,
        where('grosor', '==', '20mm'),
        where('status', '==', 'published'),
        where('active', '==', true),
        orderBy('name')
      );
      const snapshot20mm = await getDocs(q20mm);
      const all20mm = snapshot20mm.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      this.productos20mm = this.shuffleArray(all20mm).slice(0, 4);
      
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error loading products:', error);
      
      // Check if error is due to index building
      if (error?.message?.includes('index is currently building')) {
        console.log('Firestore index is building. Retrying in 5 seconds...');
        // Retry after 5 seconds
        setTimeout(() => this.loadProductos(), 5000);
      } else {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }
  }
  
  private async loadGalleryImages() {
    try {
      const mediaQuery = query(
        collection(this.firestore, 'media'),
        where('relatedEntityType', '==', 'gallery')
      );
      
      const snapshot = await getDocs(mediaQuery);
      const allImages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Media));
      
      if (allImages.length >= 2) {
        const shuffled = this.shuffleArray(allImages);
        this.galleryImage1 = shuffled[0];
        this.galleryImage2 = shuffled[1];
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error loading gallery images:', error);
    }
  }
}

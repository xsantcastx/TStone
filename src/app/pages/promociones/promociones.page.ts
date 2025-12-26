import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Timestamp } from '@angular/fire/firestore';
import { ProductFirestoreService, FirestoreProduct } from '../../services/product-firestore.service';
import { LanguageCode } from '../../models/product';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-promociones-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ProductCardComponent],
  templateUrl: './promociones.page.html',
  styleUrl: './promociones.page.scss'
})
export class PromocionesPageComponent implements OnInit {
  private productService = inject(ProductFirestoreService);
  private languageService = inject(LanguageService);

  promotionalProducts: FirestoreProduct[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadPromotionalProducts();
  }

  private loadPromotionalProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (allProducts) => {
        const now = new Date();
        
        // Filter products that are marked as promotion and currently active
        this.promotionalProducts = allProducts.filter((product) => {
          if (!product.isPromotion || product.status !== 'published') {
            return false;
          }

          // Check if promotion is within date range (if dates are set)
          if (product.promotionStartDate) {
            const startDate = this.toDate(product.promotionStartDate);
            if (startDate && now < startDate) {
              return false;
            }
          }
          
          if (product.promotionEndDate) {
            const endDate = this.toDate(product.promotionEndDate);
            if (endDate && now > endDate) {
              return false;
            }
          }

          return true;
        });

        // Sort by newest promotion start date first
        this.promotionalProducts.sort((a, b) => {
          const dateA = a.promotionStartDate ? this.toDate(a.promotionStartDate)?.getTime() || 0 : 0;
          const dateB = b.promotionStartDate ? this.toDate(b.promotionStartDate)?.getTime() || 0 : 0;
          return dateB - dateA;
        });
        
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private toDate(value: Date | Timestamp | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    return null;
  }

  getPromotionLabel(product: FirestoreProduct): string {
    const lang = this.languageService.getCurrentLanguage();
    
    if (product.promotionLabelTranslations && product.promotionLabelTranslations[lang]) {
      return product.promotionLabelTranslations[lang] || 'Oferta';
    }
    
    return product.promotionLabel || 'Oferta';
  }
}

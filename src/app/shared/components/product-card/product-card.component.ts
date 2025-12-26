import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Timestamp } from '@angular/fire/firestore';
import { Product, LanguageCode } from '../../../models/product';
import { FirestoreProduct } from '../../../services/product-firestore.service';
import { CartService } from '../../../services/cart.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  standalone: true,
  selector: 'ts-product-card',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product | FirestoreProduct;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() grosorPath?: string; // e.g., "12mm" for routing
  @Input() showPromotionBadge = false;
  
  adding = false;
  
  constructor(
    private cart: CartService,
    private languageService: LanguageService
  ) {}

  add() {
    this.adding = true;
    this.cart.add(this.product, 1);
    setTimeout(() => this.adding = false, 800);
  }

  getProductRoute(): string[] {
    if (this.grosorPath && this.product.grosor) {
      return ['/productos', this.product.grosor, this.product.slug || this.product.id || ''];
    }
    return ['/productos', this.product.slug || this.product.id || ''];
  }

  getAplicaciones(grosor?: string): string {
    switch (grosor) {
      case '12mm': return 'cocinas y baños residenciales';
      case '15mm': return 'espacios comerciales y residenciales';
      case '20mm': return 'exteriores y zonas de alto tránsito';
      default: return 'diversos proyectos';
    }
  }

  isPromotionActive(): boolean {
    if (!this.product.isPromotion) return false;
    
    const now = new Date();
    const start = this.toDate(this.product.promotionStartDate);
    const end = this.toDate(this.product.promotionEndDate);
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    
    return true;
  }

  getPromotionLabel(): string {
    const currentLang = this.languageService.getCurrentLanguage() as LanguageCode;
    
    if (this.product.promotionLabelTranslations && this.product.promotionLabelTranslations[currentLang]) {
      return this.product.promotionLabelTranslations[currentLang] || 'Oferta';
    }
    
    return this.product.promotionLabel || 'Oferta';
  }

  private toDate(value: Date | Timestamp | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    return null;
  }
}
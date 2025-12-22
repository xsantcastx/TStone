import { Injectable, inject } from '@angular/core';
import { AuthService, UserProfile } from './auth.service';
import { Product } from '../models/product';
import { Observable, map } from 'rxjs';

export interface PricingResult {
  price: number;
  originalPrice?: number;
  discount?: number;
  tierName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private authService = inject(AuthService);

  /**
   * Get the personalized price for a product based on user's tier or custom pricing
   */
  getPersonalizedPrice(product: Product, userProfile: UserProfile | null): PricingResult {
    // No user logged in - return base price
    if (!userProfile) {
      return {
        price: product.price || 0
      };
    }

    // Check for user-specific custom price first
    if (product.customPrices && product.customPrices[userProfile.uid]) {
      return {
        price: product.customPrices[userProfile.uid],
        originalPrice: product.price,
        tierName: 'Custom Price'
      };
    }

    // Check for tier-based pricing
    let tierPrice: number | undefined;
    let tierName: string | undefined;

    switch (userProfile.priceTier) {
      case 'vip':
        tierPrice = product.priceVIP;
        tierName = 'VIP';
        break;
      case 'premium':
        tierPrice = product.pricePremium;
        tierName = 'Premium';
        break;
      case 'standard':
        tierPrice = product.priceStandard;
        tierName = 'Standard';
        break;
      case 'custom':
        // Apply custom discount percentage
        if (userProfile.customDiscount && product.price) {
          const discountAmount = product.price * (userProfile.customDiscount / 100);
          tierPrice = product.price - discountAmount;
          tierName = `Custom ${userProfile.customDiscount}% Off`;
        }
        break;
    }

    // If tier price exists, return it with discount info
    if (tierPrice !== undefined && product.price) {
      const discount = product.price - tierPrice;
      return {
        price: tierPrice,
        originalPrice: product.price,
        discount: discount,
        tierName: tierName
      };
    }

    // Fallback to base price
    return {
      price: product.price || 0
    };
  }

  /**
   * Get personalized price as observable
   */
  getPersonalizedPrice$(product: Product): Observable<PricingResult> {
    return this.authService.userProfile$.pipe(
      map(userProfile => this.getPersonalizedPrice(product, userProfile))
    );
  }

  /**
   * Apply personalized pricing to a list of products
   */
  applyPersonalizedPricing(products: Product[], userProfile: UserProfile | null): Product[] {
    return products.map(product => ({
      ...product,
      price: this.getPersonalizedPrice(product, userProfile).price
    }));
  }

  /**
   * Check if user has access to special pricing
   */
  hasSpecialPricing(userProfile: UserProfile | null): boolean {
    if (!userProfile) return false;
    return !!(
      userProfile.priceTier ||
      userProfile.customDiscount
    );
  }

  /**
   * Get discount percentage for display
   */
  getDiscountPercentage(pricingResult: PricingResult): number {
    if (!pricingResult.originalPrice || !pricingResult.discount) {
      return 0;
    }
    return Math.round((pricingResult.discount / pricingResult.originalPrice) * 100);
  }
}

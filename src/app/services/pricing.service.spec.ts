import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PricingService, PricingResult } from './pricing.service';
import { AuthService, UserProfile } from './auth.service';
import { Product } from '../models/product';
import { of } from 'rxjs';

describe('PricingService', () => {
  let service: PricingService;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Saint Laurent',
    slug: 'saint-laurent',
    grosor: '12mm',
    size: '160×320cm',
    imageUrl: '/assets/productos/saint-laurent.jpg',
    price: 1000,
    priceStandard: 1000,
    pricePremium: 850,
    priceVIP: 700,
    customPrices: {
      'special-user-123': 600
    }
  };

  const standardUserProfile: UserProfile = {
    uid: 'standard-user',
    email: 'standard@topstone.com',
    displayName: 'Standard User',
    role: 'client',
    priceTier: 'standard',
    createdAt: new Date()
  };

  const premiumUserProfile: UserProfile = {
    uid: 'premium-user',
    email: 'premium@topstone.com',
    displayName: 'Premium User',
    role: 'client',
    priceTier: 'premium',
    createdAt: new Date()
  };

  const vipUserProfile: UserProfile = {
    uid: 'vip-user',
    email: 'vip@topstone.com',
    displayName: 'VIP User',
    role: 'client',
    priceTier: 'vip',
    createdAt: new Date()
  };

  const customUserProfile: UserProfile = {
    uid: 'custom-user',
    email: 'custom@topstone.com',
    displayName: 'Custom User',
    role: 'client',
    priceTier: 'custom',
    customDiscount: 20,
    createdAt: new Date()
  };

  const specialUserProfile: UserProfile = {
    uid: 'special-user-123',
    email: 'special@topstone.com',
    displayName: 'Special User',
    role: 'client',
    priceTier: 'standard',
    createdAt: new Date()
  };

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', [], {
      userProfile$: of(null)
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PricingService,
        { provide: AuthService, useValue: authServiceMock }
      ]
    });

    service = TestBed.inject(PricingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPersonalizedPrice()', () => {
    it('should return base price for non-logged-in users', () => {
      const result: PricingResult = service.getPersonalizedPrice(mockProduct, null);

      expect(result.price).toBe(1000);
      expect(result.originalPrice).toBeUndefined();
      expect(result.discount).toBeUndefined();
    });

    it('should return standard price for standard tier users', () => {
      const result: PricingResult = service.getPersonalizedPrice(mockProduct, standardUserProfile);

      expect(result.price).toBe(1000);
      expect(result.tierName).toBe('Standard');
    });

    it('should return premium price for premium tier users', () => {
      const result: PricingResult = service.getPersonalizedPrice(mockProduct, premiumUserProfile);

      expect(result.price).toBe(850);
      expect(result.originalPrice).toBe(1000);
      expect(result.discount).toBe(150);
      expect(result.tierName).toBe('Premium');
    });

    it('should return VIP price for VIP tier users', () => {
      const result: PricingResult = service.getPersonalizedPrice(mockProduct, vipUserProfile);

      expect(result.price).toBe(700);
      expect(result.originalPrice).toBe(1000);
      expect(result.discount).toBe(300);
      expect(result.tierName).toBe('VIP');
    });

    it('should apply custom discount percentage', () => {
      const result: PricingResult = service.getPersonalizedPrice(mockProduct, customUserProfile);

      expect(result.price).toBe(800); // 1000 - 20%
      expect(result.originalPrice).toBe(1000);
      expect(result.discount).toBe(200);
      expect(result.tierName).toBe('Custom 20% Off');
    });

    it('should prioritize user-specific custom prices over tier pricing', () => {
      const result: PricingResult = service.getPersonalizedPrice(mockProduct, specialUserProfile);

      expect(result.price).toBe(600);
      expect(result.originalPrice).toBe(1000);
      expect(result.tierName).toBe('Custom Price');
    });

    it('should fallback to base price when tier price is not defined', () => {
      const productWithoutTierPrices: Product = {
        ...mockProduct,
        priceStandard: undefined,
        pricePremium: undefined,
        priceVIP: undefined
      };

      const result = service.getPersonalizedPrice(productWithoutTierPrices, premiumUserProfile);

      expect(result.price).toBe(1000);
    });

    it('should handle products without base price', () => {
      const productWithoutPrice: Product = {
        ...mockProduct,
        price: undefined
      };

      const result = service.getPersonalizedPrice(productWithoutPrice, null);

      expect(result.price).toBe(0);
    });
  });

  describe('getPersonalizedPrice$()', () => {
    it('should return observable with pricing for logged-in user', (done) => {
      Object.defineProperty(authServiceMock, 'userProfile$', {
        value: of(premiumUserProfile)
      });

      service.getPersonalizedPrice$(mockProduct).subscribe(result => {
        expect(result.price).toBe(850);
        expect(result.tierName).toBe('Premium');
        done();
      });
    });

    it('should return base price observable for non-logged-in user', (done) => {
      Object.defineProperty(authServiceMock, 'userProfile$', {
        value: of(null)
      });

      service.getPersonalizedPrice$(mockProduct).subscribe(result => {
        expect(result.price).toBe(1000);
        done();
      });
    });
  });

  describe('applyPersonalizedPricing()', () => {
    const products: Product[] = [
      mockProduct,
      {
        ...mockProduct,
        id: 'prod-2',
        price: 1500,
        priceStandard: 1500,
        pricePremium: 1200,
        priceVIP: 1000
      }
    ];

    it('should apply pricing to all products for premium user', () => {
      const result = service.applyPersonalizedPricing(products, premiumUserProfile);

      expect(result[0].price).toBe(850);
      expect(result[1].price).toBe(1200);
    });

    it('should apply pricing to all products for VIP user', () => {
      const result = service.applyPersonalizedPricing(products, vipUserProfile);

      expect(result[0].price).toBe(700);
      expect(result[1].price).toBe(1000);
    });

    it('should keep original prices for non-logged-in users', () => {
      const result = service.applyPersonalizedPricing(products, null);

      expect(result[0].price).toBe(1000);
      expect(result[1].price).toBe(1500);
    });

    it('should not mutate original product array', () => {
      const originalPrices = products.map(p => p.price);
      
      service.applyPersonalizedPricing(products, vipUserProfile);

      expect(products[0].price).toBe(originalPrices[0]);
      expect(products[1].price).toBe(originalPrices[1]);
    });
  });

  describe('Discount Calculations', () => {
    it('should calculate correct discount for 15% off', () => {
      const user: UserProfile = {
        ...customUserProfile,
        customDiscount: 15
      };

      const result = service.getPersonalizedPrice(mockProduct, user);

      expect(result.price).toBe(850); // 1000 - 15%
      expect(result.discount).toBe(150);
    });

    it('should calculate correct discount for 50% off', () => {
      const user: UserProfile = {
        ...customUserProfile,
        customDiscount: 50
      };

      const result = service.getPersonalizedPrice(mockProduct, user);

      expect(result.price).toBe(500);
      expect(result.discount).toBe(500);
    });

    it('should handle 0% discount', () => {
      const user: UserProfile = {
        ...customUserProfile,
        customDiscount: 0
      };

      const result = service.getPersonalizedPrice(mockProduct, user);

      expect(result.price).toBe(1000);
      expect(result.discount).toBe(0);
    });
  });
});

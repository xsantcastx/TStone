import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CartService } from './cart.service';
import { Product, CartState } from '../models/product';
import { take } from 'rxjs';

describe('CartService', () => {
  let service: CartService;
  let mockProduct1: Product;
  let mockProduct2: Product;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(CartService);
    
    // Mock products
    mockProduct1 = {
      id: 'prod-1',
      name: 'Saint Laurent',
      slug: 'saint-laurent',
      grosor: '12mm',
      size: '160×320cm',
      imageUrl: '/assets/productos/saint-laurent.jpg',
      priceStandard: 100
    };
    
    mockProduct2 = {
      id: 'prod-2',
      name: 'Calacatta Gold',
      slug: 'calacatta-gold',
      grosor: '15mm',
      size: '160×320cm',
      imageUrl: '/assets/productos/calacatta.jpg',
      priceStandard: 150
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('add()', () => {
    it('should add a product to the cart', (done) => {
      service.add(mockProduct1);
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items.length).toBe(1);
        expect(cart.items[0].product.id).toBe('prod-1');
        expect(cart.items[0].qty).toBe(1);
        done();
      });
    });

    it('should increment quantity if product already exists', (done) => {
      service.add(mockProduct1);
      service.add(mockProduct1, 2);
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items.length).toBe(1);
        expect(cart.items[0].qty).toBe(3);
        done();
      });
    });

    it('should add multiple different products', (done) => {
      service.add(mockProduct1);
      service.add(mockProduct2, 2);
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items.length).toBe(2);
        expect(cart.items[0].product.id).toBe('prod-1');
        expect(cart.items[1].product.id).toBe('prod-2');
        done();
      });
    });

    it('should persist to localStorage', () => {
      service.add(mockProduct1);
      
      const stored = JSON.parse(localStorage.getItem('ts_cart_v1') || '{}');
      expect(stored.items.length).toBe(1);
      expect(stored.items[0].product.id).toBe('prod-1');
    });
  });

  describe('remove()', () => {
    it('should remove a product from the cart', (done) => {
      service.add(mockProduct1);
      service.add(mockProduct2);
      service.remove('prod-1');
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items.length).toBe(1);
        expect(cart.items[0].product.id).toBe('prod-2');
        done();
      });
    });

    it('should handle removing non-existent product', (done) => {
      service.add(mockProduct1);
      service.remove('non-existent');
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items.length).toBe(1);
        done();
      });
    });
  });

  describe('updateQty()', () => {
    it('should update quantity of existing product', (done) => {
      service.add(mockProduct1);
      service.updateQty('prod-1', 5);
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items[0].qty).toBe(5);
        done();
      });
    });

    it('should enforce minimum quantity of 1', (done) => {
      service.add(mockProduct1, 5);
      service.updateQty('prod-1', 0);
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items[0].qty).toBe(1);
        done();
      });
    });

    it('should not update quantity for non-existent product', (done) => {
      service.add(mockProduct1);
      const initialQty = service.snapshot().items[0].qty;
      service.updateQty('non-existent', 10);
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items[0].qty).toBe(initialQty);
        done();
      });
    });
  });

  describe('clear()', () => {
    it('should remove all items from cart', (done) => {
      service.add(mockProduct1);
      service.add(mockProduct2, 2);
      service.clear();
      
      service.cart$.pipe(take(1)).subscribe((cart: CartState) => {
        expect(cart.items.length).toBe(0);
        done();
      });
    });

    it('should clear localStorage', () => {
      service.add(mockProduct1);
      service.clear();
      
      const stored = JSON.parse(localStorage.getItem('ts_cart_v1') || '{}');
      expect(stored.items.length).toBe(0);
    });
  });

  describe('count$ observable', () => {
    it('should emit total item count', (done) => {
      service.add(mockProduct1, 2);
      service.add(mockProduct2, 3);
      
      service.count$.pipe(take(1)).subscribe((count: number) => {
        expect(count).toBe(5);
        done();
      });
    });

    it('should emit 0 for empty cart', (done) => {
      service.count$.pipe(take(1)).subscribe((count: number) => {
        expect(count).toBe(0);
        done();
      });
    });
  });

  describe('snapshot()', () => {
    it('should return current cart state', () => {
      service.add(mockProduct1);
      const snapshot = service.snapshot();
      
      expect(snapshot.items.length).toBe(1);
      expect(snapshot.items[0].product.id).toBe('prod-1');
    });
  });

  describe('localStorage persistence', () => {
    it('should load cart from localStorage on initialization', () => {
      // Clear and recreate TestBed to get fresh service instance
      TestBed.resetTestingModule();
      
      // Pre-populate localStorage
      const preloadedCart = {
        items: [
          { product: mockProduct1, qty: 3 }
        ]
      };
      localStorage.setItem('ts_cart_v1', JSON.stringify(preloadedCart));
      
      // Configure new TestBed and create fresh service instance
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()]
      });
      
      const newService: CartService = TestBed.inject(CartService);
      const snapshot = newService.snapshot();
      
      expect(snapshot.items.length).toBe(1);
      expect(snapshot.items[0].qty).toBe(3);
      expect(snapshot.items[0].product.id).toBe('prod-1');
    });

    it('should handle corrupted localStorage data', () => {
      // Clear and recreate TestBed
      TestBed.resetTestingModule();
      
      localStorage.setItem('ts_cart_v1', 'invalid-json{');
      
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()]
      });
      
      const newService: CartService = TestBed.inject(CartService);
      const snapshot = newService.snapshot();
      
      expect(snapshot.items.length).toBe(0);
    });
  });
});

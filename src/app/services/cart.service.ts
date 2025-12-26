import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, map } from 'rxjs';
import { CartItem, CartState, Product } from '../models/product';
import { FirestoreProduct } from './product-firestore.service';

const LS_KEY = 'ts_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private state$ = new BehaviorSubject<CartState>(this.load());
  readonly cart$ = this.state$.asObservable();
  readonly count$ = this.cart$.pipe(map(s => s.items.reduce((n, i) => n + i.qty, 0)));

  private load(): CartState {
    // Only access localStorage in browser
    if (!isPlatformBrowser(this.platformId)) {
      return { items: [] };
    }
    
    try { 
      return JSON.parse(localStorage.getItem(LS_KEY) || '{"items":[]}'); 
    } catch { 
      return { items: [] }; 
    }
  }
  
  private save(state: CartState) { 
    // Only save to localStorage in browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(LS_KEY, JSON.stringify(state)); 
    }
  }

  add(product: Product | FirestoreProduct, qty = 1) {
    const s = structuredClone(this.state$.value);
    const found = s.items.find(i => i.product.id === product.id);
    if (found) found.qty += qty;
    else s.items.push({ product: product as Product, qty });
    this.save(s); this.state$.next(s);
  }
  remove(productId: string) {
    const s = structuredClone(this.state$.value);
    s.items = s.items.filter(i => i.product.id !== productId);
    this.save(s); this.state$.next(s);
  }
  updateQty(productId: string, qty: number) {
    const s = structuredClone(this.state$.value);
    const it = s.items.find(i => i.product.id === productId);
    if (it) { it.qty = Math.max(1, qty|0); this.save(s); this.state$.next(s); }
  }
  clear() { const s: CartState = { items: [] }; this.save(s); this.state$.next(s); }
  snapshot() { return this.state$.value; }
}
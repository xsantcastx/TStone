import { Component, HostListener, inject, PLATFORM_ID, EventEmitter, Output, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ProductFirestoreService, FirestoreProduct } from '../../../services/product-firestore.service';
import { SettingsService } from '../../../services/settings.service';
import { LanguageSelectorComponent } from '../../../shared/components/language-selector/language-selector.component';
import { CartButtonComponent } from '../../../shared/components/cart-button/cart-button.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LanguageSelectorComponent, CartButtonComponent, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output() toggleCart = new EventEmitter<void>();

  private platformId = inject(PLATFORM_ID);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly productService = inject(ProductFirestoreService);
  private readonly settingsService = inject(SettingsService);
  
  scrolled = false;
  mobileOpen = false;
  showMega = false;
  showUserMenu = false;
  hoverPreviewUrl = 'assets/productos/12mm/saint-laurent.jpg';
  
  // Auth state
  user$ = this.authService.user$;
  userProfile$ = this.authService.userProfile$;
  
  // Settings state
  settings$ = this.settingsService.settings$;
  
  // Mega menu state and controls
  private hideTimer: any;

  @ViewChild('mega') megaRef!: ElementRef<HTMLDivElement>;
  @ViewChild('megaTrigger') megaTriggerRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('productsGroup') productsGroupRef!: ElementRef<HTMLDivElement>;

  readonly totalItems = toSignal(
    this.cartService.count$,
    { initialValue: 0 }
  ) as () => number;
  
  // Dynamic product data from Firestore
  productos12mm: { name: string; slug: string; imageUrl?: string }[] = [];
  productos15mm: { name: string; slug: string; imageUrl?: string }[] = [];
  productos20mm: { name: string; slug: string; imageUrl?: string }[] = [];

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    // Load 12mm products
    this.productService.getProductsByThickness('12mm').subscribe(products => {
      this.productos12mm = products
        .filter(p => p.available !== false)
        .map(p => ({
          name: p.name,
          slug: p.slug,
          imageUrl: p.imageUrl || p.coverImage || ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    // Load 15mm products
    this.productService.getProductsByThickness('15mm').subscribe(products => {
      this.productos15mm = products
        .filter(p => p.available !== false)
        .map(p => ({
          name: p.name,
          slug: p.slug,
          imageUrl: p.imageUrl || p.coverImage || ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    // Load 20mm products
    this.productService.getProductsByThickness('20mm').subscribe(products => {
      this.productos20mm = products
        .filter(p => p.available !== false)
        .map(p => ({
          name: p.name,
          slug: p.slug,
          imageUrl: p.imageUrl || p.coverImage || ''
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  ngOnDestroy() {
    // Clean up timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    // Only run in browser to avoid SSR issues
    if (isPlatformBrowser(this.platformId)) {
      this.scrolled = window.scrollY > 8;
    }
  }

  // Mega menu hover controls with delay for stability
  openMega() {
    clearTimeout(this.hideTimer);
    this.showMega = true;
  }

  closeMegaDelayed(event?: MouseEvent | FocusEvent) {
    clearTimeout(this.hideTimer);

    const relatedTarget = (event as FocusEvent)?.relatedTarget as HTMLElement | null;
    if (relatedTarget && (this.productsGroupRef?.nativeElement.contains(relatedTarget) || this.megaRef?.nativeElement.contains(relatedTarget))) {
      return;
    }

    this.hideTimer = setTimeout(() => {
      this.closeMegaImmediate();
    }, 150);
  }

  closeMegaImmediate(restoreFocus = false) {
    clearTimeout(this.hideTimer);
    if (this.showMega) {
      this.showMega = false;
      if (restoreFocus) {
        this.focusMegaTrigger();
      }
    }
  }

  // Caret button toggles without affecting the Products link
  toggleMega(ev: MouseEvent) {
    ev.stopPropagation();
    this.showMega = !this.showMega;
    if (this.showMega) {
      setTimeout(() => this.focusFirstMegaItem(), 0);
    }
  }

  // Close when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.productsGroupRef) return;
    const g = this.productsGroupRef.nativeElement;
    if (!g.contains(e.target as Node)) this.closeMegaImmediate();
    
    // Close user menu when clicking outside
    this.showUserMenu = false;
  }

  // Close when mouse leaves viewport
  @HostListener('document:mouseout', ['$event'])
  onDocMouseOut(e: MouseEvent) {
    if (!e.relatedTarget || (e.relatedTarget as Element).nodeName === 'HTML') {
      this.closeMegaImmediate();
    }
  }

  @HostListener('document:focusin', ['$event'])
  onDocumentFocusIn(event: FocusEvent) {
    if (!this.showMega || !this.megaRef || !this.productsGroupRef) return;
    const target = event.target as HTMLElement;
    if (!this.megaRef.nativeElement.contains(target) && !this.productsGroupRef.nativeElement.contains(target)) {
      this.closeMegaImmediate();
    }
  }

  // ESC to close
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closeMegaImmediate(true);
      this.showUserMenu = false;
    }
  }

  activarCarrito(): void {
    this.toggleCart.emit();
  }

  onProductHover(grosor: string, slug: string, imageUrl?: string) {
    // Use the product's actual image if available, otherwise fallback to assets
    if (imageUrl) {
      this.hoverPreviewUrl = imageUrl;
    } else {
      this.hoverPreviewUrl = `assets/productos/${grosor}/${slug}.jpg`;
    }
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  // User menu controls
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    console.log('Closing user menu');
    this.showUserMenu = false;
  }

  // Auth methods
  async logout(): Promise<void> {
    console.log('Logging out user');
    await this.authService.signOutUser();
    this.closeMobile();
    this.closeUserMenu();
  }

  // Support dual logo versions as per README specs
  get logoSrc() {
    return this.scrolled ? '/assets/topstone-mark-dark.svg' : '/assets/topstone-mark-light.svg';
  }

  handleMegaFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    if (!next) {
      this.closeMegaDelayed(event);
      return;
    }
    if (this.productsGroupRef?.nativeElement.contains(next) || this.megaRef?.nativeElement.contains(next)) {
      return;
    }
    this.closeMegaDelayed(event);
  }

  onMegaTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.showMega) {
        this.openMega();
      }
      setTimeout(() => this.focusFirstMegaItem(), 0);
    }
  }

  onMegaKeydown(event: KeyboardEvent) {
    if (!this.showMega || !this.megaRef) return;
    if (event.key === 'Tab') {
      const focusable = this.getMegaFocusableElements();
      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private getMegaFocusableElements(): HTMLElement[] {
    if (!this.megaRef) {
      return [];
    }
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(this.megaRef.nativeElement.querySelectorAll(selector)) as HTMLElement[];
  }

  private focusFirstMegaItem() {
    const focusable = this.getMegaFocusableElements();
    if (focusable.length) {
      focusable[0].focus();
    }
  }

  private focusMegaTrigger() {
    if (this.megaTriggerRef) {
      this.megaTriggerRef.nativeElement.focus();
    }
  }
}

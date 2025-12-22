import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ProductCardComponent } from './product-card.component';
import { CartService } from '../../../services/cart.service';
import { provideRouter } from '@angular/router';
import { Product } from '../../../models/product';
import { By } from '@angular/platform-browser';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  let cartServiceMock: jasmine.SpyObj<CartService>;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Saint Laurent',
    slug: 'saint-laurent',
    grosor: '12mm',
    size: '160×320cm',
    imageUrl: '/assets/productos/saint-laurent.jpg',
    priceStandard: 1000,
    description: 'Beautiful marble-look porcelain'
  };

  beforeEach(async () => {
    cartServiceMock = jasmine.createSpyObj('CartService', ['add']);

    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CartService, useValue: cartServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('add()', () => {
    it('should call CartService.add() with product and quantity 1', () => {
      component.add();

      expect(cartServiceMock.add).toHaveBeenCalledWith(mockProduct, 1);
    });

    it('should set adding to true when adding product', () => {
      component.add();

      expect(component.adding).toBe(true);
    });

    it('should reset adding to false after 800ms', fakeAsync(() => {
      component.add();
      expect(component.adding).toBe(true);

      tick(800);

      expect(component.adding).toBe(false);
    }));

    it('should handle multiple rapid clicks gracefully', fakeAsync(() => {
      component.add();
      component.add();
      component.add();

      expect(cartServiceMock.add).toHaveBeenCalledTimes(3);
      
      tick(800);
      expect(component.adding).toBe(false);
    }));
  });

  describe('getProductRoute()', () => {
    it('should return route with grosor when grosorPath is provided', () => {
      component.grosorPath = '12mm';
      const route = component.getProductRoute();

      expect(route).toEqual(['/productos', '12mm', 'saint-laurent']);
    });

    it('should return route without grosor when grosorPath is not provided', () => {
      component.grosorPath = undefined;
      const route = component.getProductRoute();

      expect(route).toEqual(['/productos', 'saint-laurent']);
    });

    it('should use product id as fallback when slug is not available', () => {
      component.product = { ...mockProduct, slug: '' };
      const route = component.getProductRoute();

      expect(route).toEqual(['/productos', 'prod-1']);
    });

    it('should handle missing grosor in product', () => {
      component.product = { ...mockProduct, grosor: undefined as any };
      component.grosorPath = '12mm';
      const route = component.getProductRoute();

      expect(route).toEqual(['/productos', 'saint-laurent']);
    });
  });

  describe('getAplicaciones()', () => {
    it('should return correct application for 12mm products', () => {
      const result = component.getAplicaciones('12mm');

      expect(result).toBe('cocinas y baños residenciales');
    });

    it('should return correct application for 15mm products', () => {
      const result = component.getAplicaciones('15mm');

      expect(result).toBe('espacios comerciales y residenciales');
    });

    it('should return correct application for 20mm products', () => {
      const result = component.getAplicaciones('20mm');

      expect(result).toBe('exteriores y zonas de alto tránsito');
    });

    it('should return default application for unknown thickness', () => {
      const result = component.getAplicaciones('25mm');

      expect(result).toBe('diversos proyectos');
    });

    it('should return default application for undefined thickness', () => {
      const result = component.getAplicaciones(undefined);

      expect(result).toBe('diversos proyectos');
    });
  });

  describe('Input properties', () => {
    it('should accept product input', () => {
      expect(component.product).toEqual(mockProduct);
    });

    it('should have grid as default viewMode', () => {
      expect(component.viewMode).toBe('grid');
    });

    it('should accept list viewMode', () => {
      component.viewMode = 'list';
      expect(component.viewMode).toBe('list');
    });

    it('should accept grosorPath input', () => {
      component.grosorPath = '15mm';
      expect(component.grosorPath).toBe('15mm');
    });
  });

  describe('Template rendering', () => {
    it('should display product name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nameElement = compiled.querySelector('.product-card__name');
      
      expect(nameElement?.textContent).toContain('Saint Laurent');
    });

    it('should display product image', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const imgElement = compiled.querySelector('img') as HTMLImageElement;
      
      expect(imgElement?.src).toContain('saint-laurent.jpg');
    });

    it('should have router link to product detail', () => {
      const linkElement = fixture.debugElement.query(By.css('a[routerLink]'));
      
      expect(linkElement).toBeTruthy();
    });
  });

  describe('User interactions', () => {
    it('should call add() when add button is clicked', () => {
      spyOn(component, 'add');
      
      const button = fixture.debugElement.query(By.css('button'));
      button?.nativeElement.click();

      expect(component.add).toHaveBeenCalled();
    });

    it('should update adding state when button is clicked', fakeAsync(() => {
      const button = fixture.debugElement.query(By.css('button'));
      button?.nativeElement.click();

      expect(component.adding).toBe(true);

      tick(800);

      expect(component.adding).toBe(false);
    }));
  });
});

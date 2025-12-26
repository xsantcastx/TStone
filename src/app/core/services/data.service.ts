import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { TranslatedTextMap } from '../../models/product';

export interface Producto {
  nombre: string;
  slug: string;
  grosor: '12mm' | '15mm' | '20mm';
  medida: string;
  cover: string;
  descripcion?: string;
  aplicaciones?: string[];
}

export interface ProductosData {
  items: Producto[];
}

export interface GaleriaItem {
  src: string;
  alt: string;
  altTranslations?: TranslatedTextMap;
  producto?: string;
  proyecto?: string;
  ubicacion?: string;
}

export interface CategoriaGaleria {
  slug: string;
  titulo: string;
  items: GaleriaItem[];
}

export interface GaleriaData {
  categorias: CategoriaGaleria[];
}

export interface AcabadoSuperficie {
  nombre: string;
  descripcion: string;
  descripcionTranslations?: TranslatedTextMap;
  imagen: string;
  alt?: string;
  altTranslations?: TranslatedTextMap;
}

export interface PromocionMarketing {
  nombre: string;
  descripcion: string;
  descripcionTranslations?: TranslatedTextMap;
  imagen: string;
  alt?: string;
  altTranslations?: TranslatedTextMap;
}

export interface FichaTecnica {
  nombre: string;
  url: string;
  tamano: string;
  descripcion: string;
  descripcionTranslations?: TranslatedTextMap;
}

export interface PackingInfo {
  grosor: string;
  piezasPorPallet: number;
  pesoAprox: string;
  dimensionesPallet: string;
  superficie: string;
  superficiePallet: string;
  pesoPallet: string;
}

export interface AcabadoBorde {
  nombre: string;
  descripcion: string;
  descripcionTranslations?: TranslatedTextMap;
  imagen: string;
  alt?: string;
  altTranslations?: TranslatedTextMap;
}

export interface FijacionesFachada {
  descripcion: string;
  descripcionTranslations?: TranslatedTextMap;
  imagen: string;
  alt?: string;
  altTranslations?: TranslatedTextMap;
  ventajas: string[];
}

export interface Mantenimiento {
  limpieza: string;
  limpiezaTranslations?: TranslatedTextMap;
  frecuencia: string;
  frecuenciaTranslations?: TranslatedTextMap;
  productos: string[];
  evitar: string[];
}

export interface TestResult {
  nombre: string;
  nombreTranslations?: TranslatedTextMap;
  valorPrescrito: string;
  valorObtenido: string;
  norma?: string;
}

export interface DatosTecnicosData {
  acabadosSuperficie: AcabadoSuperficie[];
  fichasTecnicas: FichaTecnica[];
  especificacionesTecnicas: Record<string, string>;
  especificacionesTecnicasTranslations?: Record<string, TranslatedTextMap>;
  packing: PackingInfo[];
  packingDescripcion?: string;
  packingDescripcionTranslations?: TranslatedTextMap;
  acabadosBordes: AcabadoBorde[];
  fijacionesFachada: FijacionesFachada;
  mantenimiento: Mantenimiento;
  testResults: TestResult[];
  promocionMarketing: PromocionMarketing[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  getProductos(): Observable<ProductosData> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return empty data during SSR
      return of({ items: [] });
    }
    return this.http.get<ProductosData>('/assets/data/productos.json');
  }

  getGaleria(): Observable<GaleriaData> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return empty data during SSR
      return of({ categorias: [] });
    }
    return this.http.get<GaleriaData>('/assets/data/galeria.json');
  }

  getDatosTecnicos(): Observable<DatosTecnicosData> {
    if (!isPlatformBrowser(this.platformId)) {
      // Return empty data during SSR
      return of({
        acabadosSuperficie: [],
        fichasTecnicas: [],
        especificacionesTecnicas: {},
        especificacionesTecnicasTranslations: {},
        packing: [],
        packingDescripcion: '',
        packingDescripcionTranslations: {},
        acabadosBordes: [],
        fijacionesFachada: { descripcion: '', imagen: '', ventajas: [] },
        mantenimiento: { limpieza: '', frecuencia: '', productos: [], evitar: [] },
        testResults: [],
        promocionMarketing: []
      });
    }
    return this.http.get<DatosTecnicosData>('/assets/data/datos_tecnicos.json');
  }

  // Helper methods
  getProductosByGrosor(productos: Producto[], grosor: string): Producto[] {
    return productos.filter(p => p.grosor === grosor);
  }

  getProductoBySlug(productos: Producto[], slug: string): Producto | undefined {
    return productos.find(p => p.slug === slug);
  }

  getCategoriaBySlug(categorias: CategoriaGaleria[], slug: string): CategoriaGaleria | undefined {
    return categorias.find(c => c.slug === slug);
  }
}

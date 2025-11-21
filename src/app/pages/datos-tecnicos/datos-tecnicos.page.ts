import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DatosTecnicosData } from '../../core/services/data.service';
import { ImageLightboxComponent } from '../../shared/components/image-lightbox/image-lightbox.component';
import { CatalogDownloadComponent } from '../../shared/components/catalog-download/catalog-download.component';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-datos-tecnicos-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, ImageLightboxComponent, CatalogDownloadComponent],
  templateUrl: './datos-tecnicos.page.html',
  styleUrl: './datos-tecnicos.page.scss'
})
export class DatosTecnicosPageComponent implements OnInit {
  datosTecnicos: DatosTecnicosData | null = null;
  isLoading = true;
  lightboxOpen = false;
  lightboxImage = '';
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private firestore = inject(Firestore);
  private cdr = inject(ChangeDetectorRef);
  
  acordeonesAbiertos: { [key: string]: boolean } = {
    especificaciones: true, // Start with specifications open
    acabados: false,
    fichas: false,
    packing: false,
    bordes: false,
    fijaciones: false,
    mantenimiento: false,
    testResults: false
  };

  // Fallback data for immediate display
  private fallbackData: DatosTecnicosData = {
    acabadosSuperficie: [
      {
        nombre: 'Mate',
        descripcion: 'Superficie con bajo brillo, tacto suave y resistencia a las huellas.',
        imagen: '/assets/Modern/image4.jpeg'
      },
      {
        nombre: 'Pulido',
        descripcion: 'Alto brillo que realza las vetas y aporta luminosidad al espacio.',
        imagen: '/assets/Modern/image3.jpeg'
      },
      {
        nombre: 'Satinado',
        descripcion: 'Equilibrio perfecto entre mate y pulido, ideal para cualquier ambiente.',
        imagen: '/assets/Modern/image5.jpeg'
      }
    ],
    fichasTecnicas: [
      {
        nombre: 'Ficha técnica general TopStone',
        url: '/assets/fichas/topstone-ficha-general.pdf',
        tamano: '1.8MB',
        descripcion: 'Especificaciones completas de todos nuestros productos'
      },
      {
        nombre: 'Ficha técnica 12mm',
        url: '/assets/fichas/topstone-12mm.pdf',
        tamano: '950KB',
        descripcion: 'Especificaciones específicas para grosor 12mm'
      },
      {
        nombre: 'Ficha técnica 15mm',
        url: '/assets/fichas/topstone-15mm.pdf',
        tamano: '1.1MB',
        descripcion: 'Especificaciones específicas para grosor 15mm'
      },
      {
        nombre: 'Ficha técnica 20mm',
        url: '/assets/fichas/topstone-20mm.pdf',
        tamano: '1.3MB',
        descripcion: 'Especificaciones específicas para grosor 20mm'
      }
    ],
    especificacionesTecnicas: {
      'absorcionAgua': '≤ 0,5%',
      'resistenciaAbrasion': 'Clase 4',
      'resistenciaQuimicos': 'Alta',
      'resistenciaHelada': 'Sí',
      'resistenciaFlexion': '> 35 N/mm²',
      'resistenciaImpacto': 'Alta',
      'expansionTermica': '6,5 x 10⁻⁶ /°C',
      'conductividadTermica': '1,3 W/mK'
    },
    packing: [
      {
        grosor: '12mm',
        piezasPorPallet: 10,
        pesoAprox: '~35kg',
        dimensionesPallet: '165 x 325 x 45 cm',
        superficie: '5,25 m²',
        superficiePallet: '52,5 m²',
        pesoPallet: '~350kg'
      },
      {
        grosor: '15mm',
        piezasPorPallet: 8,
        pesoAprox: '~45kg',
        dimensionesPallet: '165 x 325 x 50 cm',
        superficie: '5,25 m²',
        superficiePallet: '42 m²',
        pesoPallet: '~360kg'
      },
      {
        grosor: '20mm',
        piezasPorPallet: 6,
        pesoAprox: '~63kg',
        dimensionesPallet: '165 x 325 x 55 cm',
        superficie: '5,25 m²',
        superficiePallet: '31,5 m²',
        pesoPallet: '~380kg'
      }
    ],
    acabadosBordes: [
      {
        nombre: 'Canto recto',
        descripcion: 'Borde estándar para instalaciones tradicionales',
        imagen: '/assets/datos/borde-recto.jpg'
      },
      {
        nombre: 'Biselado',
        descripcion: 'Borde en ángulo para efectos visuales sofisticados',
        imagen: '/assets/datos/biselado.jpg'
      },
      {
        nombre: 'Radio',
        descripcion: 'Borde redondeado para mayor seguridad y estética suave',
        imagen: '/assets/datos/radio.jpg'
      }
    ],
    fijacionesFachada: {
      descripcion: 'Sistemas de anclaje mecánico certificados para placas de gran formato en fachadas ventiladas.',
      imagen: '/assets/datos/fachada-anclaje.jpg',
      ventajas: [
        'Instalación rápida y segura',
        'Resistencia a cargas de viento',
        'Compatibilidad con aislamientos térmicos',
        'Mantenimiento mínimo',
        'Certificación CE'
      ]
    },
    mantenimiento: {
      limpieza: 'Limpiar con agua y jabón neutro. Evitar productos abrasivos.',
      frecuencia: 'Limpieza diaria con paño húmedo, limpieza profunda semanal',
      productos: [
        'Jabón neutro',
        'Limpiadores específicos para porcelánico',
        'Paños de microfibra'
      ],
      evitar: [
        'Ácidos fuertes',
        'Productos abrasivos',
        'Cepillos metálicos',
        'Limpiadores con amoniaco'
      ]
    },
    testResults: []
  };

  ngOnInit() {
    // Load fallback data immediately
    this.datosTecnicos = this.fallbackData;
    this.isLoading = false;
    
    // Then try to load real data if in browser
    if (this.isBrowser) {
      this.loadDatosTecnicos();
    }
  }

  private async loadDatosTecnicos() {
    try {
      const docRef = doc(this.firestore, 'content', 'datos-tecnicos');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as DatosTecnicosData;
        this.datosTecnicos = data;
      }
      
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading datos tecnicos:', error);
      // Keep fallback data on error
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleAcordeon(seccion: string) {
    this.acordeonesAbiertos[seccion] = !this.acordeonesAbiertos[seccion];
  }

  // Close all other accordions when opening one (optional behavior)
  openAccordionExclusive(seccion: string) {
    // Close all
    Object.keys(this.acordeonesAbiertos).forEach(key => {
      this.acordeonesAbiertos[key] = false;
    });
    // Open the selected one
    this.acordeonesAbiertos[seccion] = true;
  }

  formatearTexto(texto: string): string {
    return texto.replace(/([A-Z])/g, ' $1').trim();
  }

  // Helper method to get object entries for template
  getObjectEntries(obj: Record<string, string>): Array<{key: string, value: string}> {
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  }

  // Check if any accordion is open
  hasOpenAccordion(): boolean {
    return Object.values(this.acordeonesAbiertos).some(open => open);
  }

  // Get count of open accordions
  getOpenAccordionCount(): number {
    return Object.values(this.acordeonesAbiertos).filter(open => open).length;
  }

  // Open image in lightbox
  openLightbox(imageSrc: string) {
    this.lightboxImage = imageSrc;
    this.lightboxOpen = true;
  }
}

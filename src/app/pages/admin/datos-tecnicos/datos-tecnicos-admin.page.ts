import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../../../services/auth.service';
import { ImageOptimizationService } from '../../../services/image-optimization.service';
import { DatosTecnicosTranslationService } from '../../../services/datos-tecnicos-translation.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';
import { DatosTecnicosData, AcabadoSuperficie, FichaTecnica, PackingInfo, AcabadoBorde, FijacionesFachada, Mantenimiento, TestResult, PromocionMarketing } from '../../../core/services/data.service';
import { LanguageService, Language } from '../../../core/services/language.service';
import { LanguageCode, TranslatedTextMap } from '../../../models/product';

@Component({
  selector: 'app-datos-tecnicos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './datos-tecnicos-admin.page.html',
  styleUrl: './datos-tecnicos-admin.page.scss'
})
export class DatosTecnicosAdminComponent implements OnInit {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);
  private router = inject(Router);
  private imageOptimization = inject(ImageOptimizationService);
  private languageService = inject(LanguageService);
  private translationService = inject(DatosTecnicosTranslationService);
  readonly languages = this.languageService.languages;
  readonly defaultLanguage: Language = 'es';

  // Translation state
  isTranslating = signal(false);
  translationProgress = signal('');
  showTranslationModal = signal(false);

  datosTecnicos = signal<DatosTecnicosData>({
    acabadosSuperficie: [],
    fichasTecnicas: [],
    especificacionesTecnicas: {},
    especificacionesTecnicasTranslations: {},
    packing: [],
    packingDescripcion: '',
    packingDescripcionTranslations: {},
    acabadosBordes: [],
    fijacionesFachada: { descripcion: '', imagen: '', alt: '', ventajas: [], altTranslations: {}, descripcionTranslations: {} },
    mantenimiento: { limpieza: '', frecuencia: '', productos: [], evitar: [], limpiezaTranslations: {}, frecuenciaTranslations: {} },
    testResults: [],
    promocionMarketing: []
  });

  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  activeTab = signal<'specs' | 'acabados' | 'fichas' | 'packing' | 'bordes' | 'fachada' | 'mantenimiento' | 'tests' | 'promocion'>('specs');

  // Editing states
  editingSpec: { key: string; value: string } = { key: '', value: '' };
  editingVentaja = '';
  editingProducto = '';
  editingEvitar = '';

  ngOnInit(): void {
    // Check if user is admin
    this.authService.userProfile$.subscribe(profile => {
      if (!profile || profile.role !== 'admin') {
        this.router.navigate(['/']);
      }
    });

    this.loadDatosTecnicos();
  }

  async loadDatosTecnicos(): Promise<void> {
    this.isLoading.set(true);
    try {
      const docRef = doc(this.firestore, 'content', 'datos-tecnicos');
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data() as DatosTecnicosData;
        // Ensure promocionMarketing is always an array
        if (!data.promocionMarketing) {
          data.promocionMarketing = [];
        }
        this.datosTecnicos.set(data);
      }
    } catch (error) {
      console.error('Error loading datos tecnicos:', error);
      this.errorMessage.set('Error al cargar los datos técnicos');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveDatosTecnicos(): Promise<void> {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const docRef = doc(this.firestore, 'content', 'datos-tecnicos');
      await setDoc(docRef, this.datosTecnicos());
      
      this.successMessage.set('Datos técnicos guardados correctamente');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error saving datos tecnicos:', error);
      this.errorMessage.set('Error al guardar los datos técnicos');
      setTimeout(() => this.errorMessage.set(''), 3000);
    } finally {
      this.isSaving.set(false);
    }
  }

  // Especificaciones Técnicas
  addSpec(): void {
    if (this.editingSpec.key && this.editingSpec.value) {
      const current = this.datosTecnicos();
      const specs = { ...current.especificacionesTecnicas };
      specs[this.editingSpec.key] = this.editingSpec.value;
      
      this.datosTecnicos.set({
        ...current,
        especificacionesTecnicas: specs
      });
      
      this.editingSpec = { key: '', value: '' };
    }
  }

  removeSpec(key: string): void {
    const current = this.datosTecnicos();
    const specs = { ...current.especificacionesTecnicas };
    delete specs[key];

    const specTranslations = { ...(current.especificacionesTecnicasTranslations || {}) };
    delete specTranslations[key];

    this.datosTecnicos.set({
      ...current,
      especificacionesTecnicas: specs,
      especificacionesTecnicasTranslations: specTranslations
    });
  }

  updateSpec(key: string, value: string): void {
    const current = this.datosTecnicos();
    const specs = { ...current.especificacionesTecnicas };
    specs[key] = value;
    
    this.datosTecnicos.set({
      ...current,
      especificacionesTecnicas: specs
    });
  }

  updateSpecTranslation(key: string, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const specTranslations = { ...(current.especificacionesTecnicasTranslations || {}) };
    const translations: TranslatedTextMap = { ...(specTranslations[key] || {}) };
    const trimmed = value.trim();

    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }

    if (Object.keys(translations).length > 0) {
      specTranslations[key] = translations;
    } else {
      delete specTranslations[key];
    }

    this.datosTecnicos.set({
      ...current,
      especificacionesTecnicasTranslations: specTranslations
    });
  }

  getSpecEntries(): Array<{key: string, value: string}> {
    return Object.entries(this.datosTecnicos().especificacionesTecnicas)
      .map(([key, value]) => ({ key, value }));
  }

  // Acabados Superficie
  addAcabado(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      acabadosSuperficie: [
        ...current.acabadosSuperficie,
        { nombre: '', descripcion: '', descripcionTranslations: {}, imagen: '', alt: '', altTranslations: {} }
      ]
    });
  }

  removeAcabado(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      acabadosSuperficie: current.acabadosSuperficie.filter((_, i) => i !== index)
    });
  }

  updateAcabado(index: number, field: keyof AcabadoSuperficie, value: string): void {
    const current = this.datosTecnicos();
    const acabados = [...current.acabadosSuperficie];
    acabados[index] = { ...acabados[index], [field]: value };
    
    this.datosTecnicos.set({
      ...current,
      acabadosSuperficie: acabados
    });
  }

  updateAcabadoAlt(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const acabados = [...current.acabadosSuperficie];
    const target = acabados[index];
    if (!target) return;

    acabados[index] = this.updateAltTranslations(target, lang, value);
    this.datosTecnicos.set({
      ...current,
      acabadosSuperficie: acabados
    });
  }

  updateAcabadoDescripcionTranslation(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const acabados = [...current.acabadosSuperficie];
    const target = acabados[index];
    if (!target) return;

    const translations: TranslatedTextMap = { ...(target.descripcionTranslations || {}) };
    const trimmed = value.trim();
    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }
    acabados[index] = { ...target, descripcionTranslations: translations };

    this.datosTecnicos.set({
      ...current,
      acabadosSuperficie: acabados
    });
  }

  async uploadAcabadoImage(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      // Show optimization in progress
      this.successMessage.set('Optimizando imagen...');
      
      // Optimize image
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      this.successMessage.set('Subiendo imagen...');
      
      const timestamp = Date.now();
      const filename = `acabado-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `datos-tecnicos/acabados/${filename}`);
      
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);
      
      this.updateAcabado(index, 'imagen', url);
      this.successMessage.set(`Imagen subida correctamente (${reduction}% más pequeña)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      this.errorMessage.set('Error al subir la imagen');
    }
  }

  // Promoción y Marketing
  addPromocion(): void {
    const current = this.datosTecnicos();
    const currentPromo = current.promocionMarketing || [];
    this.datosTecnicos.set({
      ...current,
      promocionMarketing: [
        ...currentPromo,
        { nombre: '', descripcion: '', descripcionTranslations: {}, imagen: '', alt: '', altTranslations: {} }
      ]
    });
  }

  removePromocion(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      promocionMarketing: current.promocionMarketing.filter((_, i) => i !== index)
    });
  }

  updatePromocion(index: number, field: keyof PromocionMarketing, value: string): void {
    const current = this.datosTecnicos();
    const promociones = [...current.promocionMarketing];
    promociones[index] = { ...promociones[index], [field]: value };
    
    this.datosTecnicos.set({
      ...current,
      promocionMarketing: promociones
    });
  }

  updatePromocionAlt(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const promociones = [...current.promocionMarketing];
    const target = promociones[index];
    if (!target) return;

    promociones[index] = this.updateAltTranslations(target, lang, value);
    this.datosTecnicos.set({
      ...current,
      promocionMarketing: promociones
    });
  }

  updatePromocionDescripcionTranslation(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const promociones = [...current.promocionMarketing];
    const target = promociones[index];
    if (!target) return;

    const translations: TranslatedTextMap = { ...(target.descripcionTranslations || {}) };
    const trimmed = value.trim();
    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }
    promociones[index] = { ...target, descripcionTranslations: translations };

    this.datosTecnicos.set({
      ...current,
      promocionMarketing: promociones
    });
  }

  async uploadPromocionImage(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      // Show optimization in progress
      this.successMessage.set('Optimizando imagen...');
      
      // Optimize image
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Promocion image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      this.successMessage.set('Subiendo imagen...');
      
      const timestamp = Date.now();
      const filename = `promocion-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `datos-tecnicos/promocion/${filename}`);
      
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);
      
      this.updatePromocion(index, 'imagen', url);
      this.successMessage.set(`Imagen subida correctamente (${reduction}% más pequeña)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading promocion image:', error);
      this.errorMessage.set('Error al subir la imagen');
    }
  }

  // Fichas Técnicas
  addFicha(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      fichasTecnicas: [
        ...current.fichasTecnicas,
        { nombre: '', url: '', tamano: '', descripcion: '', descripcionTranslations: {} }
      ]
    });
  }

  removeFicha(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      fichasTecnicas: current.fichasTecnicas.filter((_, i) => i !== index)
    });
  }

  updateFicha(index: number, field: keyof FichaTecnica, value: string): void {
    const current = this.datosTecnicos();
    const fichas = [...current.fichasTecnicas];
    fichas[index] = { ...fichas[index], [field]: value };
    
    this.datosTecnicos.set({
      ...current,
      fichasTecnicas: fichas
    });
  }

  updateFichaDescripcionTranslation(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const fichas = [...current.fichasTecnicas];
    const target = fichas[index];
    if (!target) return;

    const translations: TranslatedTextMap = { ...(target.descripcionTranslations || {}) };
    const trimmed = value.trim();
    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }
    fichas[index] = { ...target, descripcionTranslations: translations };

    this.datosTecnicos.set({
      ...current,
      fichasTecnicas: fichas
    });
  }

  // Packing
  addPacking(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      packing: [
        ...current.packing,
        { grosor: '', piezasPorPallet: 0, pesoAprox: '', dimensionesPallet: '', superficie: '', superficiePallet: '', pesoPallet: '' }
      ]
    });
  }

  removePacking(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      packing: current.packing.filter((_, i) => i !== index)
    });
  }

  updatePacking(index: number, field: keyof PackingInfo, value: any): void {
    const current = this.datosTecnicos();
    const packing = [...current.packing];
    packing[index] = { ...packing[index], [field]: value };
    
    this.datosTecnicos.set({
      ...current,
      packing: packing
    });
  }

  updatePackingDescripcion(value: string): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      packingDescripcion: value
    });
  }

  updatePackingDescripcionTranslation(lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const translations: TranslatedTextMap = { ...(current.packingDescripcionTranslations || {}) };
    const trimmed = value.trim();

    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }

    this.datosTecnicos.set({
      ...current,
      packingDescripcionTranslations: translations
    });
  }

  // Acabados Bordes
  addBorde(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      acabadosBordes: [
        ...current.acabadosBordes,
        { nombre: '', descripcion: '', descripcionTranslations: {}, imagen: '', alt: '', altTranslations: {} }
      ]
    });
  }

  removeBorde(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      acabadosBordes: current.acabadosBordes.filter((_, i) => i !== index)
    });
  }

  updateBorde(index: number, field: keyof AcabadoBorde, value: string): void {
    const current = this.datosTecnicos();
    const bordes = [...current.acabadosBordes];
    bordes[index] = { ...bordes[index], [field]: value };
    
    this.datosTecnicos.set({
      ...current,
      acabadosBordes: bordes
    });
  }

  updateBordeAlt(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const bordes = [...current.acabadosBordes];
    const target = bordes[index];
    if (!target) return;

    bordes[index] = this.updateAltTranslations(target, lang, value);
    this.datosTecnicos.set({
      ...current,
      acabadosBordes: bordes
    });
  }

  updateBordeDescripcionTranslation(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const bordes = [...current.acabadosBordes];
    const target = bordes[index];
    if (!target) return;

    const translations: TranslatedTextMap = { ...(target.descripcionTranslations || {}) };
    const trimmed = value.trim();
    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }
    bordes[index] = { ...target, descripcionTranslations: translations };

    this.datosTecnicos.set({
      ...current,
      acabadosBordes: bordes
    });
  }

  async uploadBordeImage(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      // Show optimization in progress
      this.successMessage.set('Optimizando imagen...');
      
      // Optimize image
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      this.successMessage.set('Subiendo imagen...');
      
      const timestamp = Date.now();
      const filename = `borde-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `datos-tecnicos/bordes/${filename}`);
      
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);
      
      this.updateBorde(index, 'imagen', url);
      this.successMessage.set(`Imagen subida correctamente (${reduction}% más pequeña)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      this.errorMessage.set('Error al subir la imagen');
    }
  }

  // Fijaciones Fachada
  updateFijacion(field: keyof FijacionesFachada, value: string): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      fijacionesFachada: {
        ...current.fijacionesFachada,
        [field]: value
      }
    });
  }

  updateFachadaAlt(lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const updated = this.updateAltTranslations(current.fijacionesFachada, lang, value);
    this.datosTecnicos.set({
      ...current,
      fijacionesFachada: updated
    });
  }

  updateFachadaDescripcionTranslation(lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const target = current.fijacionesFachada;
    const translations: TranslatedTextMap = { ...(target.descripcionTranslations || {}) };
    const trimmed = value.trim();

    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }

    this.datosTecnicos.set({
      ...current,
      fijacionesFachada: {
        ...target,
        descripcionTranslations: translations
      }
    });
  }

  addVentaja(): void {
    if (this.editingVentaja.trim()) {
      const current = this.datosTecnicos();
      this.datosTecnicos.set({
        ...current,
        fijacionesFachada: {
          ...current.fijacionesFachada,
          ventajas: [...current.fijacionesFachada.ventajas, this.editingVentaja.trim()]
        }
      });
      this.editingVentaja = '';
    }
  }

  removeVentaja(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      fijacionesFachada: {
        ...current.fijacionesFachada,
        ventajas: current.fijacionesFachada.ventajas.filter((_, i) => i !== index)
      }
    });
  }

  async uploadFachadaImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      // Show optimization in progress
      this.successMessage.set('Optimizando imagen...');
      
      // Optimize image
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      this.successMessage.set('Subiendo imagen...');
      
      const timestamp = Date.now();
      const filename = `fachada-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `datos-tecnicos/fachada/${filename}`);
      
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);
      
      this.updateFijacion('imagen', url);
      this.successMessage.set(`Imagen subida correctamente (${reduction}% más pequeña)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      this.errorMessage.set('Error al subir la imagen');
    }
  }

  // Mantenimiento
  updateMantenimiento(field: keyof Omit<Mantenimiento, 'productos' | 'evitar'>, value: string): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      mantenimiento: {
        ...current.mantenimiento,
        [field]: value
      }
    });
  }

  updateMantenimientoTranslation(field: 'limpiezaTranslations' | 'frecuenciaTranslations', lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const translations: TranslatedTextMap = { ...(current.mantenimiento[field] || {}) };
    const trimmed = value.trim();

    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }

    this.datosTecnicos.set({
      ...current,
      mantenimiento: {
        ...current.mantenimiento,
        [field]: translations
      }
    });
  }

  addProducto(): void {
    if (this.editingProducto.trim()) {
      const current = this.datosTecnicos();
      this.datosTecnicos.set({
        ...current,
        mantenimiento: {
          ...current.mantenimiento,
          productos: [...current.mantenimiento.productos, this.editingProducto.trim()]
        }
      });
      this.editingProducto = '';
    }
  }

  removeProducto(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      mantenimiento: {
        ...current.mantenimiento,
        productos: current.mantenimiento.productos.filter((_, i) => i !== index)
      }
    });
  }

  addEvitar(): void {
    if (this.editingEvitar.trim()) {
      const current = this.datosTecnicos();
      this.datosTecnicos.set({
        ...current,
        mantenimiento: {
          ...current.mantenimiento,
          evitar: [...current.mantenimiento.evitar, this.editingEvitar.trim()]
        }
      });
      this.editingEvitar = '';
    }
  }

  removeEvitar(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      mantenimiento: {
        ...current.mantenimiento,
        evitar: current.mantenimiento.evitar.filter((_, i) => i !== index)
      }
    });
  }

  // Test Results
  addTest(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      testResults: [
        ...(current.testResults || []),
        { nombre: '', valorPrescrito: '', valorObtenido: '', norma: '', nombreTranslations: {} }
      ]
    });
  }

  removeTest(index: number): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      testResults: (current.testResults || []).filter((_, i) => i !== index)
    });
  }

  updateTest(index: number, field: keyof TestResult, value: string): void {
    const current = this.datosTecnicos();
    const tests = [...(current.testResults || [])];
    tests[index] = { ...tests[index], [field]: value };
    
    this.datosTecnicos.set({
      ...current,
      testResults: tests
    });
  }

  updateTestNombreTranslation(index: number, lang: Language, value: string): void {
    const current = this.datosTecnicos();
    const tests = [...(current.testResults || [])];
    const target = tests[index];
    if (!target) return;

    const translations: TranslatedTextMap = { ...(target.nombreTranslations || {}) };
    const trimmed = value.trim();
    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }

    tests[index] = { ...target, nombreTranslations: translations };

    this.datosTecnicos.set({
      ...current,
      testResults: tests
    });
  }

  private updateAltTranslations<T extends { alt?: string; altTranslations?: TranslatedTextMap }>(
    item: T,
    lang: Language,
    value: string
  ): T {
    const updated = { ...item };
    const translations: TranslatedTextMap = { ...(updated.altTranslations || {}) };
    const trimmed = value.trim();

    if (trimmed) {
      translations[lang as LanguageCode] = trimmed;
    } else {
      delete translations[lang as LanguageCode];
    }

    updated.altTranslations = translations;
    if (lang === this.defaultLanguage || !updated.alt) {
      updated.alt = trimmed;
    }

    return updated;
  }

  // Helper method to convert string to number in template
  toNumber(value: string): number {
    return Number(value);
  }

  // ============================================================
  // TRANSLATION MIGRATION METHODS
  // ============================================================

  openTranslationModal(): void {
    this.showTranslationModal.set(true);
    this.translationProgress.set('');
  }

  closeTranslationModal(): void {
    this.showTranslationModal.set(false);
    this.translationProgress.set('');
  }

  async runDatosTecnicosTranslation(): Promise<void> {
    if (this.isTranslating()) return;

    const confirm = window.confirm(
      'This will auto-translate all Spanish content in Datos Técnicos to English, French, and Italian.\n\n' +
      'Existing translations will be overwritten.\n\n' +
      'Continue?'
    );

    if (!confirm) return;

    this.isTranslating.set(true);
    this.translationProgress.set('Starting technical data translation...');

    try {
      const result = await this.translationService.migrateDatosTecnicos();

      if (result.success) {
        this.translationProgress.set(`✅ ${result.message}`);
        
        // Reload data to show translations
        await this.loadDatosTecnicos();
      } else {
        this.translationProgress.set(`❌ ${result.message}`);
      }

    } catch (error) {
      console.error('Translation error:', error);
      this.translationProgress.set(`❌ Translation failed: ${error}`);
    } finally {
      this.isTranslating.set(false);
    }
  }
}

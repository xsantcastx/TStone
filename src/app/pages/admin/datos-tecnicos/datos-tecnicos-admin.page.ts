import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../../../services/auth.service';
import { ImageOptimizationService } from '../../../services/image-optimization.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';
import { DatosTecnicosData, AcabadoSuperficie, FichaTecnica, PackingInfo, AcabadoBorde, FijacionesFachada, Mantenimiento } from '../../../core/services/data.service';

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

  datosTecnicos = signal<DatosTecnicosData>({
    acabadosSuperficie: [],
    fichasTecnicas: [],
    especificacionesTecnicas: {},
    packing: [],
    acabadosBordes: [],
    fijacionesFachada: { descripcion: '', imagen: '', ventajas: [] },
    mantenimiento: { limpieza: '', frecuencia: '', productos: [], evitar: [] }
  });

  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  activeTab = signal<'specs' | 'acabados' | 'fichas' | 'packing' | 'bordes' | 'fachada' | 'mantenimiento'>('specs');

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
        this.datosTecnicos.set(snapshot.data() as DatosTecnicosData);
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
    
    this.datosTecnicos.set({
      ...current,
      especificacionesTecnicas: specs
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
        { nombre: '', descripcion: '', imagen: '' }
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

  // Fichas Técnicas
  addFicha(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      fichasTecnicas: [
        ...current.fichasTecnicas,
        { nombre: '', url: '', tamano: '', descripcion: '' }
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

  // Packing
  addPacking(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      packing: [
        ...current.packing,
        { grosor: '', piezasPorPallet: 0, pesoAprox: '', dimensionesPallet: '', volumen: '' }
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

  // Acabados Bordes
  addBorde(): void {
    const current = this.datosTecnicos();
    this.datosTecnicos.set({
      ...current,
      acabadosBordes: [
        ...current.acabadosBordes,
        { nombre: '', descripcion: '', imagen: '' }
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

  // Helper method to convert string to number in template
  toNumber(value: string): number {
    return Number(value);
  }
}

import { Component, inject, signal, ChangeDetectorRef, OnInit, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CatalogService, Catalog } from '../../../services/catalog.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-catalogs-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './catalogs-admin.page.html',
  styleUrls: ['./catalogs-admin.page.scss']
})
export class CatalogsAdminPage implements OnInit {
  private catalogService = inject(CatalogService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private previewAttempted = new Set<string>();
  
  catalogs$ = this.catalogService.catalogs$;
  isUploading = signal(false);
  uploadProgress = signal(0);
  
  // Form fields
  catalogName = signal('');
  catalogDescription = signal('');
  catalogVersion = signal('');
  selectedFile: File | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Generate first-page previews for catalogs uploaded before previews existed
    this.catalogs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(catalogs => {
      const missing = catalogs.filter(c => c.id && !c.previewUrl && !this.previewAttempted.has(c.id));
      if (missing.length) this.generateMissingPreviews(missing);
    });
  }

  private async generateMissingPreviews(catalogs: Catalog[]): Promise<void> {
    for (const c of catalogs) {
      this.previewAttempted.add(c.id!);
      this.busyId.set(c.id!);
      try {
        await this.catalogService.generatePreview(c);
      } catch (error) {
        console.warn(`Could not auto-generate preview for "${c.name}":`, error);
      }
    }
    this.busyId.set(null);
    this.cdr.detectChanges();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      
      // Auto-fill name if empty
      if (!this.catalogName()) {
        const fileName = this.selectedFile.name.replace('.pdf', '');
        this.catalogName.set(fileName);
      }
    }
  }

  async uploadCatalog(): Promise<void> {
    if (!this.selectedFile || !this.catalogName()) {
      alert('Por favor selecciona un archivo y proporciona un nombre');
      return;
    }

    // Validate PDF
    if (!this.selectedFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se permiten archivos PDF');
      return;
    }
    
    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (this.selectedFile.size > maxSize) {
      const fileSizeMB = (this.selectedFile.size / (1024 * 1024)).toFixed(2);
      alert(`El archivo es demasiado grande (${fileSizeMB}MB). El tamaño máximo permitido es 500MB.\n\nPor favor, comprime el PDF usando herramientas como Adobe Acrobat, SmallPDF.com, o PDF Compressor.`);
      return;
    }
    
    // Warn for large files
    if (this.selectedFile.size > 100 * 1024 * 1024) {
      const fileSizeMB = (this.selectedFile.size / (1024 * 1024)).toFixed(2);
      if (!confirm(`El archivo es bastante grande (${fileSizeMB}MB). La subida puede tardar varios minutos.\n\n¿Deseas continuar?`)) {
        return;
      }
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);
    
    try {
      await this.catalogService.uploadCatalog(
        this.selectedFile,
        this.catalogName(),
        this.catalogDescription(),
        this.catalogVersion(),
        '',
        (progress) => {
          this.uploadProgress.set(Math.round(progress));
          this.cdr.detectChanges();
        }
      );
      
      // Reset form
      this.catalogName.set('');
      this.catalogDescription.set('');
      this.catalogVersion.set('');
      this.selectedFile = null;
      
      // Reset file input
      const fileInput = document.getElementById('catalogFile') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      this.cdr.detectChanges(); // Force UI update
      alert('Catálogo subido exitosamente');
    } catch (error) {
      console.error('Error uploading catalog:', error);
      this.cdr.detectChanges(); // Force UI update
      alert('Error al subir el catálogo');
    } finally {
      this.isUploading.set(false);
      this.uploadProgress.set(0);
      this.cdr.detectChanges(); // Force UI update
    }
  }

  async deleteCatalog(catalog: Catalog): Promise<void> {
    if (!confirm(`¿Eliminar el catálogo "${catalog.name}"?`)) {
      return;
    }

    try {
      await this.catalogService.deleteCatalog(catalog.id!, catalog.fileUrl);
      this.cdr.detectChanges(); // Force UI update
      alert('Catálogo eliminado');
    } catch (error) {
      console.error('Error deleting catalog:', error);
      this.cdr.detectChanges(); // Force UI update
      alert('Error al eliminar el catálogo');
    }
  }

  async setAsLatest(catalog: Catalog): Promise<void> {
    try {
      await this.catalogService.setLatestCatalog(catalog.id!);
      this.cdr.detectChanges(); // Force UI update
      alert('Catálogo marcado como más reciente');
    } catch (error) {
      console.error('Error setting latest catalog:', error);
      this.cdr.detectChanges(); // Force UI update
      alert('Error al actualizar el catálogo');
    }
  }

  selectedIds = signal<Set<string>>(new Set());
  busyId = signal<string | null>(null);

  isSelected(c: Catalog): boolean {
    return this.selectedIds().has(c.id!);
  }

  toggleSelected(c: Catalog): void {
    const next = new Set(this.selectedIds());
    if (next.has(c.id!)) next.delete(c.id!); else next.add(c.id!);
    this.selectedIds.set(next);
  }

  allSelected(list: Catalog[] | null): boolean {
    return !!list && list.length > 0 && list.every(c => this.selectedIds().has(c.id!));
  }

  toggleAll(list: Catalog[] | null): void {
    if (!list) return;
    this.selectedIds.set(this.allSelected(list) ? new Set() : new Set(list.map(c => c.id!)));
  }

  isVisible(c: Catalog): boolean {
    return c.isPublic !== false;
  }

  async setVisibilityBulk(isPublic: boolean): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) return;
    try {
      await this.catalogService.setVisibility(ids, isPublic);
      this.selectedIds.set(new Set());
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Error al actualizar la visibilidad');
    }
    this.cdr.detectChanges();
  }

  async toggleVisibility(c: Catalog): Promise<void> {
    try {
      await this.catalogService.setVisibility([c.id!], !this.isVisible(c));
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Error al actualizar la visibilidad');
    }
    this.cdr.detectChanges();
  }

  async setAsLumina(c: Catalog): Promise<void> {
    try {
      await this.catalogService.setLuminaCatalog(c.id!);
    } catch (error) {
      console.error('Error setting LUMINA catalog:', error);
      alert('Error al marcar el catálogo como LUMINA');
    }
    this.cdr.detectChanges();
  }

  async generatePreview(c: Catalog): Promise<void> {
    this.busyId.set(c.id!);
    try {
      await this.catalogService.generatePreview(c);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('No se pudo generar la vista previa');
    } finally {
      this.busyId.set(null);
      this.cdr.detectChanges();
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

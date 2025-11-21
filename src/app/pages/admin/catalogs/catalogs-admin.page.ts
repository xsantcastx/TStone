import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class CatalogsAdminPage {
  private catalogService = inject(CatalogService);
  private cdr = inject(ChangeDetectorRef);
  
  catalogs$ = this.catalogService.catalogs$;
  isUploading = signal(false);
  uploadProgress = signal(0);
  
  // Form fields
  catalogName = signal('');
  catalogDescription = signal('');
  catalogVersion = signal('');
  selectedFile: File | null = null;

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

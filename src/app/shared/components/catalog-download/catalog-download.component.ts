import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../../services/catalog.service';

@Component({
  selector: 'app-catalog-download',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-download.component.html',
  styleUrls: ['./catalog-download.component.scss']
})
export class CatalogDownloadComponent {
  private catalogService = inject(CatalogService);
  
  @Input() variant: 'primary' | 'secondary' | 'minimal' = 'primary';
  @Input() showDescription = true;
  
  latestCatalog$ = this.catalogService.latestCatalog$;

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

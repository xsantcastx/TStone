import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../services/settings.service';
import { CatalogDownloadComponent } from '../../../shared/components/catalog-download/catalog-download.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, CatalogDownloadComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  private settingsService = inject(SettingsService);
  
  readonly year = new Date().getFullYear();
  readonly settings$ = this.settingsService.settings$;
}

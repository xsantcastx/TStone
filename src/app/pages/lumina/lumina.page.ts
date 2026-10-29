import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CatalogService } from '../../services/catalog.service';

@Component({
  selector: 'app-lumina-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './lumina.page.html'
})
export class LuminaPageComponent {
  private catalogService = inject(CatalogService);
  lumina$ = this.catalogService.luminaCatalog$;

  readonly highlightKeys = [
    'food_contact', 'through_body', 'large_formats', 'translucent',
    'heat_resistance', 'low_silica', 'impact', 'stain'
  ];
  readonly designs = ['Taj Mahal Royal', 'Pink House', 'Crystallo'];
}

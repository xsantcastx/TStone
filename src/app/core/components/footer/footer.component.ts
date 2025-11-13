import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="body-dark py-16">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-4 gap-8 mb-12">
          
          <!-- Logo y descripción -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <img [src]="(settings$ | async)?.logoUrl || '/assets/topstone-mark-light.svg'" alt="TopStone" class="h-8 w-auto"/>
              <span class="font-serif text-xl font-semibold text-ts-ink">{{ (settings$ | async)?.siteName || 'TopStone' }}</span>
            </div>
            <p class="text-ts-ink-soft mb-6 max-w-md">
              {{ (settings$ | async)?.siteTagline || 'Superficies porcelánicas de gran formato que transforman espacios con diseño, resistencia y versatilidad excepcionales.' }}
            </p>
            <div class="flex gap-4">
              @if ((settings$ | async)?.socialMedia?.facebook) {
                <a [href]="(settings$ | async)?.socialMedia?.facebook" target="_blank" rel="noopener" class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.instagram) {
                <a [href]="(settings$ | async)?.socialMedia?.instagram" target="_blank" rel="noopener" class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.052 0C6.507 0 2.005 4.502 2.005 10.047c0 4.434 2.897 8.202 6.906 9.527-.095-.847-.181-2.148.038-3.071.198-.833 1.281-5.429 1.281-5.429s-.327-.654-.327-1.62c0-1.518.881-2.652 1.975-2.652.932 0 1.383.699 1.383 1.537 0 .936-.597 2.337-.905 3.635-.258 1.089.546 1.977 1.621 1.977 1.946 0 3.444-2.053 3.444-5.015 0-2.623-1.885-4.457-4.575-4.457-3.115 0-4.943 2.337-4.943 4.753 0 .941.362 1.949.814 2.497.089.108.102.203.075.314-.082.34-.267 1.096-.303 1.249-.047.196-.153.237-.354.143-1.329-.618-2.161-2.56-2.161-4.123 0-3.354 2.436-6.434 7.027-6.434 3.689 0 6.556 2.628 6.556 6.146 0 3.668-2.314 6.622-5.523 6.622-1.078 0-2.094-.56-2.441-1.298l-.664 2.53c-.24.923-.889 2.081-1.324 2.787.997.308 2.055.472 3.154.472 5.545 0 10.047-4.502 10.047-10.047C22.099 4.502 17.597.001 12.052.001z"/>
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.linkedin) {
                <a [href]="(settings$ | async)?.socialMedia?.linkedin" target="_blank" rel="noopener" class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.youtube) {
                <a [href]="(settings$ | async)?.socialMedia?.youtube" target="_blank" rel="noopener" class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              }
            </div>
            
            @if ((settings$ | async)?.contactEmail || (settings$ | async)?.contactPhone || (settings$ | async)?.address) {
              <div class="mt-6 space-y-2 text-ts-ink-soft text-sm">
                @if ((settings$ | async)?.contactEmail) {
                  <p>📧 {{ (settings$ | async)?.contactEmail }}</p>
                }
                @if ((settings$ | async)?.contactPhone) {
                  <p>📞 {{ (settings$ | async)?.contactPhone }}</p>
                }
                @if ((settings$ | async)?.address) {
                  <p>📍 {{ (settings$ | async)?.address }}</p>
                }
              </div>
            }
          </div>

          <!-- Enlaces rápidos -->
          <div>
            <h3 class="font-semibold text-ts-ink mb-4">Enlaces rápidos</h3>
            <ul class="space-y-2">
              <li><a routerLink="/" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Inicio</a></li>
              <li><a routerLink="/productos" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Productos</a></li>
              <li><a routerLink="/galeria" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Galería</a></li>
              <li><a routerLink="/datos-tecnicos" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Datos técnicos</a></li>
              <li><a routerLink="/contacto" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Contacto</a></li>
            </ul>
          </div>

          <!-- Productos -->
          <div>
            <h3 class="font-semibold text-ts-ink mb-4">Productos</h3>
            <ul class="space-y-2">
              <li><a routerLink="/productos/12mm" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Colección 12mm</a></li>
              <li><a routerLink="/productos/15mm" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Colección 15mm</a></li>
              <li><a routerLink="/productos/20mm" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Colección 20mm</a></li>
            </ul>
          </div>
        </div>

        <!-- Línea divisoria -->
        <div class="border-t border-ts-line pt-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-ts-ink-soft text-sm">
              {{ (settings$ | async)?.footerText || '© 2025 TopStone. Todos los derechos reservados.' }}
            </p>
            <div class="flex gap-6 text-sm">
              <a href="#" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Política de privacidad</a>
              <a href="#" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Términos y condiciones</a>
              <a href="#" class="text-ts-ink-soft hover:text-ts-accent transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  private settingsService = inject(SettingsService);
  settings$ = this.settingsService.settings$;
}
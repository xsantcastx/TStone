import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <footer class="body-dark py-16">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid md:grid-cols-4 gap-8 mb-12">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <img
                [src]="(settings$ | async)?.logoUrl || '/assets/topstone-mark-light.svg'"
                alt="TopStone"
                class="h-8 w-auto"
              />
              <span class="font-serif text-xl font-semibold text-ts-ink">
                {{ (settings$ | async)?.siteName || ('footer.default_site_name' | translate) }}
              </span>
            </div>
            <p class="text-ts-ink-soft mb-6 max-w-md">
              {{ (settings$ | async)?.siteTagline || ('footer.default_tagline' | translate) }}
            </p>

            <div class="flex gap-4 flex-wrap">
              @if ((settings$ | async)?.socialMedia?.facebook) {
                <a
                  [href]="(settings$ | async)?.socialMedia?.facebook"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors"
                  aria-label="Facebook"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.instagram) {
                <a
                  [href]="(settings$ | async)?.socialMedia?.instagram"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors"
                  aria-label="Instagram"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                    />
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.linkedin) {
                <a
                  [href]="(settings$ | async)?.socialMedia?.linkedin"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                    />
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.youtube) {
                <a
                  [href]="(settings$ | async)?.socialMedia?.youtube"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors"
                  aria-label="YouTube"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                    />
                  </svg>
                </a>
              }
              @if ((settings$ | async)?.socialMedia?.pinterest) {
                <a
                  [href]="(settings$ | async)?.socialMedia?.pinterest"
                  target="_blank"
                  rel="noopener"
                  class="w-10 h-10 bg-ts-accent/20 rounded-full flex items-center justify-center text-ts-accent hover:bg-ts-accent hover:text-ts-bg transition-colors"
                  aria-label="Pinterest"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 0a12 12 0 0 0-4.37 23.17c-.08-.72-.15-1.83.03-2.62.16-.71 1.05-4.46 1.05-4.46s-.27-.54-.27-1.33c0-1.25.73-2.18 1.63-2.18.77 0 1.14.58 1.14 1.27 0 .77-.49 1.93-.75 3-.21.9.45 1.63 1.34 1.63 1.61 0 2.84-1.7 2.84-4.14 0-2.17-1.56-3.68-3.79-3.68-2.58 0-4.09 1.93-4.09 3.93 0 .78.3 1.61.67 2.07.07.09.08.17.06.26-.07.28-.23.94-.26 1.07-.04.17-.13.21-.3.13-1.2-.56-1.95-2.31-1.95-3.72 0-2.86 2.08-5.49 5.99-5.49 3.14 0 5.58 2.24 5.58 5.23 0 3.12-1.97 5.63-4.7 5.63-.92 0-1.78-.48-2.07-.94 0 0-.45 1.73-.56 2.15-.2.78-.75 1.76-1.12 2.35A12 12 0 1 0 12 0z"
                    />
                  </svg>
                </a>
              }
            </div>

            <div class="mt-6 space-y-2 text-ts-ink-soft text-sm">
              <p><span aria-hidden="true">📧</span> {{ (settings$ | async)?.contactEmail || ('footer.default_email' | translate) }}</p>
              <p><span aria-hidden="true">📞</span> {{ (settings$ | async)?.contactPhone || ('footer.default_phone' | translate) }}</p>
              <p><span aria-hidden="true">📍</span> {{ (settings$ | async)?.address || ('footer.default_address' | translate) }}</p>
            </div>
          </div>

          <div>
            <h3 class="font-semibold text-ts-ink mb-4">{{ 'footer.quick_links' | translate }}</h3>
            <ul class="space-y-2">
              <li><a routerLink="/" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'nav.home' | translate }}</a></li>
              <li><a routerLink="/productos" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'nav.products' | translate }}</a></li>
              <li><a routerLink="/galeria" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'nav.gallery' | translate }}</a></li>
              <li><a routerLink="/datos-tecnicos" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'nav.technical' | translate }}</a></li>
              <li><a routerLink="/contacto" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'nav.contact' | translate }}</a></li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold text-ts-ink mb-4">{{ 'footer.products_title' | translate }}</h3>
            <ul class="space-y-2">
              <li><a routerLink="/productos/12mm" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'footer.collections.12mm' | translate }}</a></li>
              <li><a routerLink="/productos/20mm" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'footer.collections.20mm' | translate }}</a></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-ts-line pt-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-ts-ink-soft text-sm">
              {{ (settings$ | async)?.footerText || ('footer.copyright' | translate) }}
            </p>
            <div class="flex gap-6 text-sm">
              <a routerLink="/privacy" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'footer.links.privacy' | translate }}</a>
              <a routerLink="/terms" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'footer.links.terms' | translate }}</a>
              <a routerLink="/cookies" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'footer.links.cookies' | translate }}</a>
              <a routerLink="/legal" class="text-ts-ink-soft hover:text-ts-accent transition-colors">{{ 'footer.links.legal' | translate }}</a>
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


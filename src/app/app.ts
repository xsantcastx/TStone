import { Component, OnInit, inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner.component';
import { AnalyticsService } from './services/analytics.service';
import { LanguageService } from './core/services/language.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CookieBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private languageService = inject(LanguageService);
  private settingsService = inject(SettingsService);
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);

  ngOnInit() {
    // Language is auto-initialized by LanguageService constructor
    // It auto-detects browser language and loads from localStorage
    
    // Initialize page view tracking on route changes (browser only)
    if (isPlatformBrowser(this.platformId)) {
      this.analyticsService.initPageViewTracking();
    }

    // Apply theme colors from settings
    this.settingsService.settings$.subscribe(settings => {
      if (isPlatformBrowser(this.platformId) && settings) {
        // Update CSS custom properties for theme colors
        if (settings.primaryColor) {
          document.documentElement.style.setProperty('--ts-primary', settings.primaryColor);
        }
        if (settings.accentColor) {
          document.documentElement.style.setProperty('--ts-accent', settings.accentColor);
        }
      }
    });
  }
}

import { Component, OnInit, inject, PLATFORM_ID, Renderer2, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner.component';
import { AnalyticsService } from './services/analytics.service';
import { LanguageService } from './core/services/language.service';
import { SettingsService } from './services/settings.service';
import { AuthService } from './services/auth.service';

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
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isMaintenanceMode = false;
  isAdmin = false;
  isAuthenticated = false;
  currentUrl = '';
  
  // Routes that should be accessible during maintenance mode
  private maintenanceExemptRoutes = [
    '/client/login',
    '/client/register',
    '/admin',
    '/maintenance'
  ];

  constructor() {
    // Subscribe to auth changes
    this.authService.userProfile$.subscribe(profile => {
      this.isAdmin = (profile?.role === 'admin');
      this.isAuthenticated = !!profile;
      this.cdr.markForCheck();
    });

    // Track current route for maintenance mode exemptions
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl = (event as NavigationEnd).url;
        this.checkMaintenanceMode();
      });
  }

  ngOnInit() {
    // Language is auto-initialized by LanguageService constructor
    // It auto-detects browser language and loads from localStorage
    
    // Hide initial loader after app is ready
    if (isPlatformBrowser(this.platformId)) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const loader = document.getElementById('app-initial-loader');
        if (loader) {
          loader.classList.add('hidden');
          // Remove from DOM after transition completes
          setTimeout(() => {
            loader.remove();
          }, 350); // Match the CSS transition duration
        }
      }, 100);
    }
    
    // Initialize page view tracking on route changes (browser only)
    if (isPlatformBrowser(this.platformId)) {
      this.analyticsService.initPageViewTracking();
    }

    // Apply theme colors from settings and check maintenance mode
    this.settingsService.settings$.subscribe(settings => {
      if (isPlatformBrowser(this.platformId) && settings) {
        // Update CSS custom properties for theme colors
        if (settings.primaryColor) {
          document.documentElement.style.setProperty('--ts-primary', settings.primaryColor);
        }
        if (settings.accentColor) {
          document.documentElement.style.setProperty('--ts-accent', settings.accentColor);
        }
        
        // Check maintenance mode
        this.isMaintenanceMode = settings.maintenanceMode || false;
        this.checkMaintenanceMode();
      }
    });
  }

  private checkMaintenanceMode(): void {
    // Redirect to maintenance page if:
    // - Maintenance mode is enabled
    // - User is not admin
    // - User is not authenticated
    // - Current route is not in exemption list
    if (this.isMaintenanceMode && 
        !this.isAdmin && 
        !this.isAuthenticated &&
        !this.isMaintenanceExemptRoute()) {
      this.router.navigate(['/maintenance']);
    } else if (!this.isMaintenanceMode && this.currentUrl === '/maintenance') {
      // Redirect away from maintenance page if mode is disabled
      this.router.navigate(['/']);
    }
  }

  private isMaintenanceExemptRoute(): boolean {
    return this.maintenanceExemptRoutes.some(route => 
      this.currentUrl.startsWith(route)
    );
  }
}

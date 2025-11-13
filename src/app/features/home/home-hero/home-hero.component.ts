import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SettingsService, HeroImage } from '../../../services/settings.service';

@Component({
  selector: 'app-home-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <section class="relative h-[70vh] min-h-[500px] overflow-hidden">
      <!-- Animated background images -->
      <div class="absolute inset-0">
        @for (image of heroImages; track image.url; let i = $index) {
          <div 
            class="absolute inset-0 transition-opacity duration-1000"
            [class.opacity-100]="currentImageIndex === i"
            [class.opacity-0]="currentImageIndex !== i"
          >
            <div class="w-full h-full animate-ken-burns">
              <img 
                [src]="image.url" 
                [alt]="image.alt"
                class="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
          </div>
        }
      </div>
      
      <!-- Hero content -->
      <div class="relative h-full flex flex-col items-start justify-end max-w-7xl mx-auto px-6 pb-16 z-10">
        <h1 class="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight text-white mb-4 animate-fade-in-up">
          {{ 'hero.title' | translate }}
        </h1>
        <p class="mt-4 max-w-xl text-lg text-white/90 leading-relaxed animate-fade-in-up animation-delay-200">
          {{ 'hero.subtitle' | translate }}
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-400">
          <a 
            routerLink="/productos" 
            class="px-8 py-4 rounded-full bg-ts-accent text-black font-semibold hover:bg-ts-accent/90 transition-all hover:scale-105 text-center shadow-lg"
          >
            {{ 'hero.cta' | translate }}
          </a>
          <a 
            routerLink="/galeria" 
            class="px-8 py-4 rounded-full ring-2 ring-white/40 text-white hover:bg-white/10 transition-all hover:scale-105 text-center backdrop-blur-sm"
          >
            {{ 'nav.gallery' | translate }}
          </a>
        </div>

        <!-- Image indicators -->
        <div class="mt-8 flex gap-2">
          @for (image of heroImages; track image.url; let i = $index) {
            <button
              (click)="setCurrentImage(i)"
              class="w-2 h-2 rounded-full transition-all"
              [class.bg-white]="currentImageIndex === i"
              [class.w-8]="currentImageIndex === i"
              [class.bg-white/40]="currentImageIndex !== i"
              [attr.aria-label]="'Image ' + (i + 1)"
            ></button>
          }
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  `,
  styles: [`
    @keyframes ken-burns {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.1);
      }
    }

    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-ken-burns {
      animation: ken-burns 20s ease-in-out infinite alternate;
    }

    .animate-fade-in-up {
      animation: fade-in-up 0.8s ease-out forwards;
      opacity: 0;
    }

    .animation-delay-200 {
      animation-delay: 0.2s;
    }

    .animation-delay-400 {
      animation-delay: 0.4s;
    }
  `]
})
export class HomeHeroComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private settingsService = inject(SettingsService);
  
  heroImages: HeroImage[] = [];
  currentImageIndex = 0;
  private interval: any;

  ngOnInit(): void {
    // Load hero images from settings
    this.settingsService.settings$.subscribe(settings => {
      this.heroImages = settings.heroImages || [];
    });

    if (isPlatformBrowser(this.platformId)) {
      this.startImageRotation();
    }
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private startImageRotation(): void {
    this.interval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.heroImages.length;
    }, 6000); // Change image every 6 seconds
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }
}

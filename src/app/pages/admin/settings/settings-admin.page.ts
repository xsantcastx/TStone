import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { SettingsService, HeroImage, AppSettings } from '../../../services/settings.service';
import { AuthService } from '../../../services/auth.service';
import { ImageOptimizationService } from '../../../services/image-optimization.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-settings-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './settings-admin.page.html',
  styleUrl: './settings-admin.page.scss'
})
export class SettingsAdminComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private storage = inject(Storage);
  private authService = inject(AuthService);
  private router = inject(Router);
  private imageOptimization = inject(ImageOptimizationService);

  settings = signal<AppSettings | null>(null);
  heroImages = signal<HeroImage[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  uploadProgress = signal<number>(0);
  activeTab = signal<'hero' | 'site' | 'maintenance' | 'visual' | 'ecommerce' | 'business'>('hero');

  ngOnInit(): void {
    // Check if user is admin
    this.authService.userProfile$.subscribe(profile => {
      if (!profile || profile.role !== 'admin') {
        console.log('Access denied: User is not admin');
        this.router.navigate(['/']);
      }
    });

    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.settings$.subscribe(settings => {
      this.settings.set(settings);
      this.heroImages.set([...settings.heroImages]);
      this.isLoading.set(false);
    });
  }

  async onImageSelected(event: Event, index: number): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.errorMessage.set('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      this.uploadProgress.set(0);
      
      // Optimize image
      this.successMessage.set('Optimizando imagen...');
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Hero image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      // Upload to Firebase Storage
      this.successMessage.set('Subiendo imagen...');
      const timestamp = Date.now();
      const filename = `hero-${timestamp}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `hero-images/${filename}`);
      
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);

      // Update hero image
      const images = [...this.heroImages()];
      images[index] = {
        ...images[index],
        url
      };
      this.heroImages.set(images);
      
      this.successMessage.set(`Imagen subida correctamente (${reduction}% más pequeña)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      this.errorMessage.set('Error al subir la imagen');
      setTimeout(() => this.errorMessage.set(''), 3000);
    }
  }

  updateAltText(index: number, value: string): void {
    const images = [...this.heroImages()];
    images[index] = {
      ...images[index],
      alt: value
    };
    this.heroImages.set(images);
  }

  addHeroImage(): void {
    const images = [...this.heroImages()];
    images.push({
      url: '',
      alt: '',
      order: images.length
    });
    this.heroImages.set(images);
  }

  removeHeroImage(index: number): void {
    const images = this.heroImages().filter((_, i) => i !== index);
    // Reorder
    images.forEach((img, i) => img.order = i);
    this.heroImages.set(images);
  }

  moveImageUp(index: number): void {
    if (index === 0) return;
    const images = [...this.heroImages()];
    [images[index - 1], images[index]] = [images[index], images[index - 1]];
    images.forEach((img, i) => img.order = i);
    this.heroImages.set(images);
  }

  moveImageDown(index: number): void {
    const images = this.heroImages();
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    newImages.forEach((img, i) => img.order = i);
    this.heroImages.set(newImages);
  }

  async saveSettings(): Promise<void> {
    this.isSaving.set(true);
    try {
      const currentSettings = this.settings();
      if (!currentSettings) return;

      // Update all settings including hero images
      await this.settingsService.saveSettings({
        ...currentSettings,
        heroImages: this.heroImages()
      });
      
      this.successMessage.set('Configuración guardada correctamente');
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      this.errorMessage.set('Error al guardar la configuración');
      setTimeout(() => this.errorMessage.set(''), 3000);
    } finally {
      this.isSaving.set(false);
    }
  }

  updateSetting(field: keyof AppSettings, value: any): void {
    const current = this.settings();
    if (current) {
      this.settings.set({ ...current, [field]: value });
    }
  }

  updateSocialMedia(platform: string, value: string): void {
    const current = this.settings();
    if (current) {
      this.settings.set({
        ...current,
        socialMedia: {
          ...current.socialMedia,
          [platform]: value
        }
      });
    }
  }

  formatSocialMediaUrl(platform: string, value: string): void {
    const current = this.settings();
    if (current) {
      // Only add https:// if there's content and it doesn't already have a protocol
      let formattedValue = value.trim();
      if (formattedValue && !formattedValue.match(/^https?:\/\//i)) {
        formattedValue = 'https://' + formattedValue;
      }
      
      this.settings.set({
        ...current,
        socialMedia: {
          ...current.socialMedia,
          [platform]: formattedValue
        }
      });
    }
  }

  updateBusinessHours(day: string, value: string): void {
    const current = this.settings();
    if (current) {
      this.settings.set({
        ...current,
        businessHours: {
          ...current.businessHours,
          [day]: value
        }
      });
    }
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      // Optimize image
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.9,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Logo optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      const filename = `logo-${Date.now()}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `site-assets/${filename}`);
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);
      this.updateSetting('logoUrl', url);
      this.successMessage.set(`Logo actualizado (${reduction}% más pequeño)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.errorMessage.set('Error al subir el logo');
    }
  }

  async onFaviconSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor selecciona un archivo de imagen');
      return;
    }

    try {
      // Optimize favicon
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.9,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Favicon optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
      
      const filename = `favicon-${Date.now()}-${optimizedFile.name}`;
      const storageRef = ref(this.storage, `site-assets/${filename}`);
      await uploadBytes(storageRef, optimizedFile);
      const url = await getDownloadURL(storageRef);
      this.updateSetting('faviconUrl', url);
      this.successMessage.set(`Favicon actualizado (${reduction}% más pequeño)`);
      setTimeout(() => this.successMessage.set(''), 3000);
    } catch (error) {
      console.error('Error uploading favicon:', error);
      this.errorMessage.set('Error al subir el favicon');
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOutUser();
    this.router.navigate(['/client/login']);
  }
}

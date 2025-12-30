import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HeroImage {
  url: string;
  alt: string;
  order: number;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  pinterest?: string;
}

export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface AppSettings {
  // Hero Images
  heroImages: HeroImage[];
  
  // Site Information
  siteName?: string;
  siteTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialMedia?: SocialMedia;
  
  // Maintenance Mode
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  
  // Visual Settings
  logoUrl?: string; // Deprecated - use logoLightUrl/logoDarkUrl instead
  logoLightUrl?: string; // Logo for dark backgrounds
  logoDarkUrl?: string;  // Logo for light backgrounds
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  footerText?: string;
  
  // E-commerce Settings
  currency?: string;
  taxRate?: number;
  showPrices?: boolean;
  minOrderAmount?: number;
  
  // Business Settings
  businessHours?: BusinessHours;
  showSampleButton?: boolean;
  googleMapsUrl?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  heroImages: [
    { url: 'assets/hero.jpg', alt: 'TopStone - Luxury Surfaces', order: 0 },
    { url: 'assets/hero2.jpg', alt: 'TopStone - Modern Design', order: 1 },
    { url: 'assets/Bathroom.jpeg', alt: 'TopStone - Bathroom Applications', order: 2 },
    { url: 'assets/Bathroom2.jpeg', alt: 'TopStone - Premium Quality', order: 3 }
  ],
  siteName: 'TopStone',
  siteTagline: 'Superficies Porcelánicas de Gran Formato',
  contactEmail: 'info@topstone.com',
  contactPhone: '+34 123 456 789',
  address: '',
  socialMedia: {
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    pinterest: ''
  },
  maintenanceMode: false,
  maintenanceMessage: 'Estamos realizando tareas de mantenimiento programado. Por favor, vuelve pronto o contacta con nuestro equipo de soporte si necesitas ayuda.',
  logoUrl: 'assets/topstone-logotype-horizontal.svg',
  faviconUrl: '',
  primaryColor: '#1a1a1a',
  accentColor: '#C9A961',
  footerText: '© 2025 TopStone. Todos los derechos reservados.',
  currency: '€',
  taxRate: 21,
  showPrices: true,
  minOrderAmount: 0,
  businessHours: {
    monday: '9:00 - 18:00',
    tuesday: '9:00 - 18:00',
    wednesday: '9:00 - 18:00',
    thursday: '9:00 - 18:00',
    friday: '9:00 - 18:00',
    saturday: '10:00 - 14:00',
    sunday: 'Cerrado'
  },
  showSampleButton: true,
  googleMapsUrl: ''
};

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private firestore = inject(Firestore);
  private settingsSubject = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS);
  
  settings$: Observable<AppSettings> = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      const settingsDoc = doc(this.firestore, 'settings', 'app');
      const snapshot = await getDoc(settingsDoc);
      
      if (snapshot.exists()) {
        const data = snapshot.data() as AppSettings;
        this.settingsSubject.next(data);
      } else {
        // Initialize with defaults
        await this.saveSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settingsSubject.next(DEFAULT_SETTINGS);
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const settingsDoc = doc(this.firestore, 'settings', 'app');
      await setDoc(settingsDoc, settings);
      this.settingsSubject.next(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  getSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  async updateHeroImages(images: HeroImage[]): Promise<void> {
    const currentSettings = this.getSettings();
    await this.saveSettings({
      ...currentSettings,
      heroImages: images.sort((a, b) => a.order - b.order)
    });
  }
}

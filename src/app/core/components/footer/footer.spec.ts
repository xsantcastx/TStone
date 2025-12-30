import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FooterComponent } from './footer';
import { SettingsService, AppSettings } from '../../../services/settings.service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let settingsServiceMock: jasmine.SpyObj<SettingsService>;
  let settingsSubject: BehaviorSubject<AppSettings>;

  const mockSettings: AppSettings = {
    heroImages: [],
    siteName: 'TopStone',
    siteTagline: 'Luxury Surfaces',
    contactEmail: 'info@topstone.com',
    contactPhone: '+34 123 456 789',
    address: 'Test Address',
    socialMedia: {
      facebook: 'https://facebook.com/topstone',
      instagram: 'https://instagram.com/topstone',
      linkedin: 'https://linkedin.com/company/topstone',
      youtube: 'https://youtube.com/topstone',
      pinterest: 'https://pinterest.com/topstone'
    },
    footerText: '© 2025 TopStone. All rights reserved.'
  };

  beforeEach(async () => {
    settingsSubject = new BehaviorSubject<AppSettings>(mockSettings);
    settingsServiceMock = jasmine.createSpyObj('SettingsService', ['loadSettings', 'getSettings'], {
      settings$: settingsSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [
        FooterComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SettingsService, useValue: settingsServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Social Media Icons', () => {
    it('should display Pinterest icon when Pinterest URL is configured', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const pinterestLink = compiled.querySelector('a[aria-label="Pinterest"]');
      
      expect(pinterestLink).toBeTruthy();
      expect(pinterestLink?.getAttribute('href')).toBe('https://pinterest.com/topstone');
    });

    it('should display all social media icons when URLs are configured', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.querySelector('a[aria-label="Facebook"]')).toBeTruthy();
      expect(compiled.querySelector('a[aria-label="Instagram"]')).toBeTruthy();
      expect(compiled.querySelector('a[aria-label="LinkedIn"]')).toBeTruthy();
      expect(compiled.querySelector('a[aria-label="YouTube"]')).toBeTruthy();
      expect(compiled.querySelector('a[aria-label="Pinterest"]')).toBeTruthy();
    });

    it('should not display Pinterest icon when URL is not configured', () => {
      const settingsWithoutPinterest = {
        ...mockSettings,
        socialMedia: {
          facebook: 'https://facebook.com/topstone',
          instagram: 'https://instagram.com/topstone'
        }
      };
      
      settingsSubject.next(settingsWithoutPinterest);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const pinterestLink = compiled.querySelector('a[aria-label="Pinterest"]');
      
      expect(pinterestLink).toBeFalsy();
    });

    it('should have correct target and rel attributes for external links', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const pinterestLink = compiled.querySelector('a[aria-label="Pinterest"]');
      
      expect(pinterestLink?.getAttribute('target')).toBe('_blank');
      expect(pinterestLink?.getAttribute('rel')).toBe('noopener');
    });
  });
});

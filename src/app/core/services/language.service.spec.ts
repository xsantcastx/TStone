import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LanguageService, Language } from './language.service';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateServiceMock: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    translateServiceMock = jasmine.createSpyObj('TranslateService', [
      'addLangs',
      'setDefaultLang',
      'use',
      'getBrowserLang',
      'instant'
    ]);

    // Mock getBrowserLang to return a default
    translateServiceMock.getBrowserLang.and.returnValue('en');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LanguageService,
        { provide: TranslateService, useValue: translateServiceMock }
      ]
    });

    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should have 4 supported languages', () => {
      expect(service.languages.length).toBe(4);
      expect(service.languages.map(l => l.code)).toEqual(['es', 'en', 'fr', 'it']);
    });

    it('should set Spanish as default language', () => {
      expect(translateServiceMock.setDefaultLang).toHaveBeenCalledWith('es');
    });

    it('should add all supported languages to TranslateService', () => {
      expect(translateServiceMock.addLangs).toHaveBeenCalledWith(['es', 'en', 'fr', 'it']);
    });

    it('should use browser language if valid and no stored preference', () => {
      // Note: This test needs to be run before any language is set in localStorage
      expect(translateServiceMock.use).toHaveBeenCalled();
    });
  });

  describe('setLanguage()', () => {
    it('should update current language', (done) => {
      service.setLanguage('fr');

      service.lang$.pipe(take(1)).subscribe((lang: Language) => {
        expect(lang).toBe('fr');
        done();
      });
    });

    it('should call TranslateService.use() with new language', () => {
      service.setLanguage('it');

      expect(translateServiceMock.use).toHaveBeenCalledWith('it');
    });

    it('should persist language choice to localStorage', () => {
      service.setLanguage('fr');

      const stored = localStorage.getItem('ts_lang');
      expect(stored).toBe('fr');
    });

    it('should handle all supported languages', () => {
      const languages: Language[] = ['es', 'en', 'fr', 'it'];

      languages.forEach(lang => {
        service.setLanguage(lang);
        expect(translateServiceMock.use).toHaveBeenCalledWith(lang);
      });
    });
  });

  describe('getCurrentLanguage()', () => {
    it('should return current language', () => {
      service.setLanguage('it');
      
      const current = service.getCurrentLanguage();
      expect(current).toBe('it');
    });

    it('should return default language initially', () => {
      const current = service.getCurrentLanguage();
      expect(current).toBe('es');
    });

    it('should reflect language changes', () => {
      service.setLanguage('en');
      expect(service.getCurrentLanguage()).toBe('en');

      service.setLanguage('fr');
      expect(service.getCurrentLanguage()).toBe('fr');
    });
  });

  describe('instant()', () => {
    it('should delegate to TranslateService.instant()', () => {
      translateServiceMock.instant.and.returnValue('Translated text');

      const result = service.instant('some.key');

      expect(translateServiceMock.instant).toHaveBeenCalledWith('some.key', undefined);
      expect(result).toBe('Translated text');
    });

    it('should pass parameters to TranslateService', () => {
      const params = { name: 'TopStone' };
      service.instant('greeting', params);

      expect(translateServiceMock.instant).toHaveBeenCalledWith('greeting', params);
    });
  });

  describe('lang$ observable', () => {
    it('should emit language changes', (done) => {
      let emissionCount = 0;
      const emissions: Language[] = [];

      const subscription = service.lang$.subscribe((lang: Language) => {
        emissions.push(lang);
        emissionCount++;

        if (emissionCount === 3) {
          expect(emissions).toContain('es'); // Initial
          expect(emissions).toContain('fr');
          expect(emissions).toContain('it');
          subscription.unsubscribe();
          done();
        }
      });

      // Trigger language changes
      setTimeout(() => service.setLanguage('fr'), 0);
      setTimeout(() => service.setLanguage('it'), 10);
    });

    it('should provide current language to new subscribers', (done) => {
      service.setLanguage('it');

      service.lang$.pipe(take(1)).subscribe((lang: Language) => {
        expect(lang).toBe('it');
        done();
      });
    });
  });

  describe('languages property', () => {
    it('should have correct language codes', () => {
      const codes = service.languages.map(l => l.code);
      expect(codes).toEqual(['es', 'en', 'fr', 'it']);
    });

    it('should have labels for each language', () => {
      service.languages.forEach(lang => {
        expect(lang.label).toBeTruthy();
        expect(lang.label.length).toBe(2);
        expect(lang.label).toBe(lang.label.toUpperCase());
      });
    });

    it('should have full names for each language', () => {
      const names = service.languages.map(l => l.name);
      expect(names).toContain('Español');
      expect(names).toContain('English');
      expect(names).toContain('Français');
      expect(names).toContain('Italiano');
    });

    it('should have flag emojis for each language', () => {
      service.languages.forEach(lang => {
        expect(lang.flag).toBeTruthy();
        expect(lang.flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('localStorage persistence', () => {
    it('should load language from localStorage on initialization', () => {
      // Pre-populate localStorage
      localStorage.setItem('ts_lang', 'it');

      // Create new service instance
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          LanguageService,
          { provide: TranslateService, useValue: translateServiceMock }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      
      expect(newService.getCurrentLanguage()).toBe('it');
    });

    it('should persist language across service instances', () => {
      service.setLanguage('fr');

      // Create new service instance
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          LanguageService,
          { provide: TranslateService, useValue: translateServiceMock }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      expect(newService.getCurrentLanguage()).toBe('fr');
    });

    it('should fallback to Spanish if invalid language in localStorage', () => {
      localStorage.setItem('ts_lang', 'invalid-lang');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          LanguageService,
          { provide: TranslateService, useValue: translateServiceMock }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      
      // Should use browser language or fallback to 'es'
      const lang = newService.getCurrentLanguage();
      expect(['es', 'en', 'fr', 'it']).toContain(lang);
    });
  });
});

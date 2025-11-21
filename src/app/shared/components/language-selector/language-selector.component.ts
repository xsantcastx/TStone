import { Component, inject, HostListener, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LanguageService, Language } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector" [class.dark-mode]="isDarkMode">
      <button
        type="button"
        (click)="toggleDropdown()"
        class="language-trigger"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen"
        [attr.aria-label]="'Language: ' + currentLanguage.name"
      >
        <span class="code">{{ currentLanguage.label }}</span>
        <svg class="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" [class.rotate-180]="isOpen">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      @if (isOpen) {
        <div class="language-menu menu-surface">
          <ul role="listbox">
            @for (lang of languageService.languages; track lang.code) {
              <li>
                <button
                  type="button"
                  (click)="selectLanguage(lang.code)"
                  class="language-option"
                  [class.active]="lang.code === currentLanguage.code"
                >
                  <span class="code-badge">{{ lang.label }}</span>
                  <span class="name">{{ lang.name }}</span>
                </button>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    .language-selector {
      position: relative;
      background: transparent;
    }

    .language-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.65rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(17, 24, 39, 0.12);
      font-weight: 600;
      background: #ffffff;
      color: #111827;
      transition: all 0.2s ease;
      cursor: pointer;
      box-shadow: 0 16px 34px -24px rgba(15, 23, 42, 0.4);
    }

    .language-trigger .code {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #4b5563;
      line-height: 1;
    }
    
    .language-trigger .chevron {
      color: #6b7280;
    }

    .language-trigger .chevron {
      width: 0.875rem;
      height: 0.875rem;
      transition: transform 0.2s ease;
      opacity: 0.6;
    }

    .language-trigger:hover {
      background: #f3f4f6;
    }

    :host-context(.text-white) .language-trigger {
      background: #1f2937;
      border-color: rgba(148, 163, 184, 0.18);
      color: #f8fafc;
      box-shadow: 0 16px 34px -24px rgba(15, 23, 42, 0.6);
    }

    :host-context(.text-white) .language-trigger .code {
      color: #ffffff;
    }
    
    :host-context(.text-white) .language-trigger .chevron {
      color: #ffffff;
    }

    :host-context(.text-white) .language-trigger:hover {
      background: #111827;
    }
    
    .dark-mode .language-trigger {
      background: #1f2937;
      border-color: rgba(148, 163, 184, 0.18);
      color: #f8fafc;
      box-shadow: 0 16px 34px -24px rgba(15, 23, 42, 0.6);
    }

    .dark-mode .language-trigger .code {
      color: #ffffff;
    }
    
    .dark-mode .language-trigger .chevron {
      color: #ffffff;
    }

    .dark-mode .language-trigger:hover {
      background: #111827;
    }

    .language-menu {
      position: absolute;
      right: 0;
      margin-top: 0.5rem;
      min-width: 12rem;
      border-radius: 0.75rem;
      padding: 0.5rem 0;
      background: #ffffff;
      color: #111827;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 130;
    }

    :host-context(.text-white) .language-menu {
      background: #ffffff;
      border-color: rgba(0, 0, 0, 0.05);
      color: #111827;
    }
    
    .dark-mode .language-menu {
      background: #ffffff;
      border-color: rgba(0, 0, 0, 0.05);
      color: #111827;
    }

    .language-menu ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .language-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #374151;
      transition: background-color 0.15s ease;
      text-align: left;
      font-size: 0.875rem;
    }

    .language-option:hover {
      background: #f9fafb;
    }

    .language-option .code-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      background: #e5e7eb;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #6b7280;
    }

    .language-option .name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .language-option.active {
      background: #fef3e2;
    }

    .language-option.active .code-badge {
      background: #b08968;
      color: #ffffff;
    }
    
    .language-option.active .name {
      color: #78350f;
      font-weight: 600;
    }

    :host-context(.text-white) .language-option {
      background: transparent;
      color: #374151;
    }

    :host-context(.text-white) .language-option:hover {
      background: #f9fafb;
    }

    :host-context(.text-white) .language-option .code-badge {
      background: #e5e7eb;
      color: #6b7280;
    }
    
    :host-context(.text-white) .language-option .name {
      color: #374151;
    }

    :host-context(.text-white) .language-option.active {
      background: #fef3e2;
    }

    :host-context(.text-white) .language-option.active .code-badge {
      background: #b08968;
      color: #ffffff;
    }
    
    :host-context(.text-white) .language-option.active .name {
      color: #78350f;
      font-weight: 600;
    }
    
    .dark-mode .language-option {
      background: transparent;
      color: #374151;
    }

    .dark-mode .language-option:hover {
      background: #f9fafb;
    }

    .dark-mode .language-option .code-badge {
      background: #e5e7eb;
      color: #6b7280;
    }
    
    .dark-mode .language-option .name {
      color: #374151;
    }

    .dark-mode .language-option.active {
      background: #fef3e2;
    }

    .dark-mode .language-option.active .code-badge {
      background: #b08968;
      color: #ffffff;
    }
    
    .dark-mode .language-option.active .name {
      color: #78350f;
      font-weight: 600;
    }
  `]
})
export class LanguageSelectorComponent {
  languageService = inject(LanguageService);
  private platformId = inject(PLATFORM_ID);
  isOpen = false;
  currentLanguage = this.languageService.languages[0];
  isDarkMode = false;

  constructor() {
    this.languageService.lang$.subscribe(lang => {
      const found = this.languageService.languages.find(l => l.code === lang);
      if (found) this.currentLanguage = found;
    });
    
    // Initial check for dark mode
    this.checkDarkMode();
  }
  
  @HostListener('window:scroll')
  onScroll() {
    this.checkDarkMode();
  }
  
  private checkDarkMode(): void {
    if (isPlatformBrowser(this.platformId)) {
      const header = document.querySelector('header');
      this.isDarkMode = header?.classList.contains('text-white') ?? false;
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    this.checkDarkMode();
  }

  selectLanguage(code: Language): void {
    this.languageService.setLanguage(code);
    this.isOpen = false;
  }
}

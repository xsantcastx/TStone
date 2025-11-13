import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Language } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="language-selector">
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
      color: rgba(248, 250, 252, 0.76);
    }

    :host-context(.text-white) .language-trigger:hover {
      background: #111827;
    }

    .language-menu {
      position: absolute;
      right: 0;
      margin-top: 0.5rem;
      min-width: 12rem;
      border-radius: 1rem;
      padding: 0.5rem 0;
      background: #ffffff;
      color: #111827;
      border: 1px solid rgba(17, 24, 39, 0.08);
      box-shadow: 0 24px 55px -22px rgba(15, 23, 42, 0.4);
      z-index: 40;
    }

    :host-context(.text-white) .language-menu {
      background: #1f2937;
      border-color: rgba(148, 163, 184, 0.25);
      color: #f8fafc;
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
      padding: 0.65rem 1rem;
      background: #ffffff;
      border: none;
      cursor: pointer;
      color: #111827;
      transition: background-color 0.18s ease, color 0.18s ease;
      text-align: left;
    }

    .language-option:hover {
      background: #f3f4f6;
    }

    .language-option .code-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      background: #f3f4f6;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #6b7280;
    }

    .language-option .name {
      font-size: 0.875rem;
      font-weight: 500;
      color: inherit;
    }

    .language-option.active {
      background: #f6efe6;
      color: #b08968;
    }

    .language-option.active .code-badge {
      background: #b08968;
      color: #ffffff;
    }

    :host-context(.text-white) .language-option {
      background: #1f2937;
      color: #f8fafc;
    }

    :host-context(.text-white) .language-option:hover {
      background: #111827;
    }

    :host-context(.text-white) .language-option .code-badge {
      background: rgba(148, 163, 184, 0.2);
      color: rgba(248, 250, 252, 0.8);
    }

    :host-context(.text-white) .language-option.active {
      background: rgba(176, 137, 104, 0.22);
      color: #f5e8d8;
    }

    :host-context(.text-white) .language-option.active .code-badge {
      background: #b08968;
      color: #ffffff;
    }
  `]
})
export class LanguageSelectorComponent {
  languageService = inject(LanguageService);
  isOpen = false;
  currentLanguage = this.languageService.languages[0];

  constructor() {
    this.languageService.lang$.subscribe(lang => {
      const found = this.languageService.languages.find(l => l.code === lang);
      if (found) this.currentLanguage = found;
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(code: Language): void {
    this.languageService.setLanguage(code);
    this.isOpen = false;
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { SettingsService } from '../../../services/settings.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsentService } from '../../../services/consent.service';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss'
})
export class CookieBannerComponent implements OnInit {
  private consentService = inject(ConsentService);
  settings$ = inject(SettingsService).settings$;
  
  showBanner = false;
  showSettings = false;
  
  // Custom consent toggles
  analyticsConsent = false;
  marketingConsent = false;
  preferencesConsent = false;

  ngOnInit() {
    // Show banner if user hasn't responded yet
    this.showBanner = !this.consentService.hasUserResponded();
  }

  acceptAll() {
    console.log('Accept All clicked');
    this.consentService.acceptAll();
    this.showBanner = false;
    this.showSettings = false;
  }

  rejectAll() {
    console.log('Reject All clicked');
    this.consentService.rejectAll();
    this.showBanner = false;
    this.showSettings = false;
  }

  openSettings() {
    this.showSettings = true;
    const current = this.consentService.getCurrentConsent();
    this.analyticsConsent = current.analytics;
    this.marketingConsent = current.marketing;
    this.preferencesConsent = current.preferences;
  }

  closeSettings() {
    this.showSettings = false;
  }

  saveCustomPreferences() {
    this.consentService.saveCustomConsent(
      this.analyticsConsent,
      this.marketingConsent,
      this.preferencesConsent
    );
    this.showBanner = false;
    this.showSettings = false;
  }
}

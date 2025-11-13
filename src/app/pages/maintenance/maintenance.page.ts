import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformServer } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance.page.html',
  styleUrls: ['./maintenance.page.scss']
})
export class MaintenancePage implements OnInit {
  private title = inject(Title);
  private meta = inject(Meta);
  private platformId = inject(PLATFORM_ID);
  private settingsService = inject(SettingsService);

  maintenanceMessage = 'Estamos realizando tareas de mantenimiento programado. Por favor, vuelve pronto.';
  contactEmail = 'info@topstone.com';
  contactPhone = '+34 123 456 789';
  retryAfterSeconds = 7200; // 2 hours

  ngOnInit() {
    // Set page title
    this.title.setTitle('Mantenimiento - TopStone');
    
    // Add noindex meta tag to prevent indexing during maintenance
    this.meta.addTags([
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'description', content: 'TopStone está realizando tareas de mantenimiento programado. Volveremos pronto.' }
    ]);

    // Load settings to get custom maintenance message
    this.settingsService.settings$.subscribe(settings => {
      if (settings.maintenanceMessage) {
        this.maintenanceMessage = settings.maintenanceMessage;
      }
      if (settings.contactEmail) {
        this.contactEmail = settings.contactEmail;
      }
      if (settings.contactPhone) {
        this.contactPhone = settings.contactPhone;
      }
    });
  }
}

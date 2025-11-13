import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SeedService } from '../../../services/seed.service';
import { MigrationService } from '../../../services/migration.service';
import { AuthService } from '../../../services/auth.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-seed-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminSidebarComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12 px-4">
      <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-serif text-neutral-800 mb-2">🌱 Database Seeder</h1>
            <p class="text-neutral-600">Initialize categories, materials, and templates</p>
          </div>

          @if (message) {
            <div class="mb-6 p-4 rounded-xl" 
                 [class.bg-green-50]="messageType === 'success'"
                 [class.bg-red-50]="messageType === 'error'"
                 [class.bg-blue-50]="messageType === 'info'">
              <p class="text-sm"
                 [class.text-green-800]="messageType === 'success'"
                 [class.text-red-800]="messageType === 'error'"
                 [class.text-blue-800]="messageType === 'info'">
                {{ message }}
              </p>
            </div>
          }

          <div class="space-y-4">
            <div class="p-4 bg-neutral-50 rounded-xl">
              <h3 class="font-semibold text-neutral-800 mb-2">What will be seeded:</h3>
              <ul class="text-sm text-neutral-600 space-y-1">
                <li>✓ Categories: 12mm, 15mm, 20mm</li>
                <li>✓ Materials: 12 unique materials from your catalog</li>
                <li>✓ Templates: Global description, SEO title, SEO meta templates</li>
              </ul>
            </div>

            <button
              (click)="runSeed()"
              [disabled]="isSeeding"
              class="w-full py-3 px-6 bg-ts-accent text-black rounded-xl font-semibold hover:bg-ts-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              @if (isSeeding) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Seeding...
              } @else {
                🌱 Run Seed
              }
            </button>

            <button
              (click)="runMigration()"
              [disabled]="isMigrating"
              class="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              @if (isMigrating) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Migrating...
              } @else {
                📦 Migrate 19 Products from JSON
              }
            </button>

            <a routerLink="/admin"
               class="block w-full py-3 px-6 text-center border border-neutral-300 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 transition-all duration-300">
              ← Back to Admin
            </a>
          </div>

          @if (logs.length > 0) {
            <div class="mt-6 p-4 bg-neutral-900 rounded-xl">
              <h3 class="text-white font-semibold mb-2">Console Log:</h3>
              <div class="space-y-1 text-xs font-mono">
                @for (log of logs; track $index) {
                  <div class="text-green-400">{{ log }}</div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  templateUrl: './seed-admin.page.html',
  styleUrl: './seed-admin.page.scss'
})
export class SeedAdminComponent {
  private seedService = inject(SeedService);
  private migrationService = inject(MigrationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSeeding = false;
  isMigrating = false;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  logs: string[] = [];
  consoleMessages: string[] = [];
  seedCompleted = false;
  seedError = '';

  async ngOnInit() {
    await this.checkAdminAccess();
  }

  clearLogs() {
    this.consoleMessages = [];
    this.logs = [];
  }

  private async checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/client/login']);
      return;
    }

    const isAdmin = await this.authService.isAdmin(user.uid);
    if (!isAdmin) {
      this.router.navigate(['/']);
      return;
    }
  }

  async runSeed() {
    if (this.isSeeding) return;

    this.isSeeding = true;
    this.message = '';
    this.logs = [];
    this.consoleMessages = [];
    this.seedCompleted = false;
    this.seedError = '';

    // Override console.log to capture logs
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const msg = args.join(' ');
      this.logs.push(msg);
      this.consoleMessages.push(msg);
      originalLog(...args);
    };

    try {
      this.message = 'Seeding in progress...';
      this.messageType = 'info';

      await this.seedService.seedAll();

      this.message = '✅ Seed completed successfully! Check console for details.';
      this.messageType = 'success';
      this.seedCompleted = true;
    } catch (error: any) {
      console.error('Seed error:', error);
      this.message = `❌ Error: ${error.message || 'Seed failed'}`;
      this.messageType = 'error';
      this.seedError = error.message || 'Seed failed';
    } finally {
      this.isSeeding = false;
      // Restore console.log
      console.log = originalLog;
    }
  }

  async runMigration() {
    if (this.isMigrating) return;

    this.isMigrating = true;
    this.message = '';
    this.logs = [];
    this.consoleMessages = [];

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalWarn = console.warn;
    console.log = (...args: any[]) => {
      const msg = args.join(' ');
      this.logs.push(msg);
      this.consoleMessages.push(msg);
      originalLog(...args);
    };
    console.warn = (...args: any[]) => {
      const msg = `⚠️ ${args.join(' ')}`;
      this.logs.push(msg);
      this.consoleMessages.push(msg);
      originalWarn(...args);
    };

    try {
      this.message = 'Migrating products from JSON...';
      this.messageType = 'info';

      await this.migrationService.migrateProductsFromJSON();

      this.message = '✅ Migration completed! Check console for details.';
      this.messageType = 'success';
    } catch (error: any) {
      console.error('Migration error:', error);
      this.message = `❌ Error: ${error.message || 'Migration failed'}`;
      this.messageType = 'error';
    } finally {
      this.isMigrating = false;
      // Restore console methods
      console.log = originalLog;
      console.warn = originalWarn;
    }
  }
}

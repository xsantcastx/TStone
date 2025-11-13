import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, UserProfile } from '../../../services/auth.service';
import {
  AdminActivityItem,
  AdminDashboardService,
  AdminDashboardSnapshot
} from '../../../services/admin-dashboard.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, AdminSidebarComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss'
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private dashboardService = inject(AdminDashboardService);

  userProfile: UserProfile | null = null;
  stats: AdminDashboardSnapshot | null = null;
  isLoading = true;

  async ngOnInit() {
    await this.checkAdminAccess();
    await this.loadDashboardStats();
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

    this.userProfile = await this.authService.getUserProfile(user.uid);
  }

  private async loadDashboardStats() {
    this.isLoading = true;
    try {
      this.stats = await this.dashboardService.getDashboardStats();
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getActivityIcon(type: AdminActivityItem['type']): string {
    const icons: Record<AdminActivityItem['type'], string> = {
      order: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      product: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      gallery: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    };
    return icons[type];
  }

  getActivityColor(type: AdminActivityItem['type']): string {
    const colors: Record<AdminActivityItem['type'], string> = {
      order: 'bg-blue-100 text-blue-600',
      product: 'bg-green-100 text-green-600',
      gallery: 'bg-purple-100 text-purple-600',
      user: 'bg-orange-100 text-orange-600'
    };
    return colors[type];
  }
}

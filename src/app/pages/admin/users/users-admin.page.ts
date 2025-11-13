import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './users-admin.page.html',
  styleUrl: './users-admin.page.scss'
})
export class UsersAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  users: UserProfile[] = [];
  filteredUsers: UserProfile[] = [];
  isLoading = true;
  searchTerm = '';
  filterRole: 'all' | 'admin' | 'client' = 'all';
  
  successMessage = '';
  errorMessage = '';
  
  showChangeRoleModal = false;
  selectedUser: UserProfile | null = null;
  newRole: 'admin' | 'client' = 'client';

  async ngOnInit() {
    await this.checkAdminAccess();
    await this.loadUsers();
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

  private async loadUsers() {
    this.isLoading = true;
    try {
      // Get all users from Firestore users collection
      this.users = await this.authService.getAllUsers();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading users:', error);
      this.errorMessage = 'Failed to load users';
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.users];

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term) ||
        user.displayName?.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (this.filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === this.filterRole);
    }

    this.filteredUsers = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onRoleFilterChange() {
    this.applyFilters();
  }

  openChangeRoleModal(user: UserProfile) {
    this.selectedUser = user;
    this.newRole = user.role;
    this.showChangeRoleModal = true;
  }

  closeChangeRoleModal() {
    this.showChangeRoleModal = false;
    this.selectedUser = null;
  }

  async confirmChangeRole() {
    if (!this.selectedUser) return;

    try {
      await this.authService.updateUserRole(this.selectedUser.uid, this.newRole);
      
      // Update local user list
      const userIndex = this.users.findIndex(u => u.uid === this.selectedUser!.uid);
      if (userIndex !== -1) {
        this.users[userIndex].role = this.newRole;
      }
      
      this.applyFilters();
      this.successMessage = `User role updated to ${this.newRole}`;
      this.closeChangeRoleModal();

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error updating user role:', error);
      this.errorMessage = 'Failed to update user role';
    }
  }

  async toggleUserStatus(user: UserProfile) {
    try {
      const newStatus = !user.disabled;
      await this.authService.updateUserStatus(user.uid, newStatus);
      
      // Update local user list
      const userIndex = this.users.findIndex(u => u.uid === user.uid);
      if (userIndex !== -1) {
        this.users[userIndex].disabled = newStatus;
      }
      
      this.applyFilters();
      this.successMessage = `User ${newStatus ? 'disabled' : 'enabled'} successfully`;

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error updating user status:', error);
      this.errorMessage = 'Failed to update user status';
    }
  }

  getBadgeClass(role: string): string {
    return role === 'admin' 
      ? 'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200' 
      : 'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200';
  }

  getStatusBadgeClass(user: UserProfile): string {
    return user.disabled 
      ? 'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200' 
      : 'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200';
  }

  getUserInitials(user: UserProfile): string {
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'N/A';
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
}

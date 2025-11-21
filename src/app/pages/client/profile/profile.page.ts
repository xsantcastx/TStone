import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, UserProfile } from '../../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  profileForm: FormGroup;
  userProfile: UserProfile | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';
  isEditMode = false;

  constructor() {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      company: [''],
      phone: ['']
    });
  }

  async ngOnInit() {
    this.loadUserProfile();
  }

  private async loadUserProfile() {
    this.isLoading = true;
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.router.navigate(['/client/login']);
        return;
      }

      const profile = await this.authService.getUserProfile(user.uid);
      if (profile) {
        this.userProfile = profile;
        this.profileForm.patchValue({
          displayName: profile.displayName || '',
          company: profile.company || '',
          phone: profile.phone || ''
        });
        this.cdr.detectChanges(); // Force change detection after loading profile
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.errorMessage = 'client.errors.load_profile_failed';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // Force change detection
    }
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isEditMode) {
      // Reset form if canceling
      this.profileForm.patchValue({
        displayName: this.userProfile?.displayName || '',
        company: this.userProfile?.company || '',
        phone: this.userProfile?.phone || ''
      });
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      const updates = this.profileForm.value;
      await this.authService.updateUserProfile(user.uid, updates);

      // Reload profile
      await this.loadUserProfile();
      
      this.isEditMode = false;
      this.successMessage = 'client.profile_updated';
    } catch (error) {
      console.error('Error updating profile:', error);
      this.errorMessage = 'client.errors.update_profile_failed';
    } finally {
      this.isSaving = false;
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods
  get displayName() {
    return this.profileForm.get('displayName');
  }

  get company() {
    return this.profileForm.get('company');
  }

  get phone() {
    return this.profileForm.get('phone');
  }
}

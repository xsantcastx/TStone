import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { EmailService } from '../../services/email.service';
import { AnalyticsService } from '../../services/analytics.service';
import { SettingsService } from '../../services/settings.service';
import { map } from 'rxjs/operators';

interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  mensaje: string;
  aceptarPrivacidad: boolean;
}

@Component({
  selector: 'app-contacto-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './contacto.page.html',
  styleUrl: './contacto.page.scss'
})
export class ContactoPageComponent {
  private platformId = inject(PLATFORM_ID);
  private analyticsService = inject(AnalyticsService);
  private settingsService = inject(SettingsService);
  private sanitizer = inject(DomSanitizer);
  
  settings$ = this.settingsService.settings$;
  googleMapsUrl$ = this.settings$.pipe(
    map(settings => settings?.googleMapsUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(settings.googleMapsUrl) : null)
  );
  
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  submitErrorMessage = '';

  constructor(
    private fb: FormBuilder,
    private emailService: EmailService
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-\(\)]{7,15}$/)]],
      empresa: ['', [Validators.maxLength(100)]],
      mensaje: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      aceptarPrivacidad: [false, [Validators.requiredTrue]]
    });
    
    // Track form start when user starts filling it
    this.contactForm.valueChanges.subscribe(() => {
      if (!this.isSubmitting && !this.submitSuccess) {
        this.analyticsService.trackFormStart('contact_form');
      }
    });
  }

  async onSubmit() {
    if (this.contactForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = false;
      this.submitSuccess = false;
      
      const formData: ContactFormData = this.contactForm.value;
      
      // Only submit if in browser (not during SSR)
      if (isPlatformBrowser(this.platformId)) {
        try {
          await this.emailService.sendContactForm(formData);
          
          // Track successful form submission
          this.analyticsService.trackFormSubmit('contact_form', true);
          this.analyticsService.trackContactSubmit('form', {
            empresa: !!formData.empresa,
            form_location: 'contacto_page'
          });
          
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.contactForm.reset();
          
          // Reset success message after 8 seconds
          setTimeout(() => {
            this.submitSuccess = false;
          }, 8000);
        } catch (error: any) {
          // Track form error
          this.analyticsService.trackFormSubmit('contact_form', false);
          this.analyticsService.trackFormError('contact_form', 'submission_error');
          
          this.isSubmitting = false;
          this.submitError = true;
          this.submitErrorMessage = error.message || 'Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.';
          
          // Reset error message after 10 seconds
          setTimeout(() => {
            this.submitError = false;
          }, 10000);
        }
      } else {
        // Fallback for SSR
        setTimeout(() => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.contactForm.reset();
        }, 1000);
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
      
      // If it's a nested form group, recursively mark as touched
      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && field.touched) {
      const errors = field.errors;
      
      if (errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          'nombre': 'El nombre',
          'email': 'El email',
          'telefono': 'El teléfono',
          'mensaje': 'El mensaje',
          'aceptarPrivacidad': 'La aceptación de la política de privacidad'
        };
        return `${fieldLabels[fieldName] || fieldName} es requerido`;
      }
      
      if (errors['email']) return 'Introduce un email válido';
      if (errors['pattern'] && fieldName === 'telefono') return 'Introduce un teléfono válido';
      if (errors['minlength']) return `Debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
      if (errors['maxlength']) return `No puede tener más de ${errors['maxlength'].requiredLength} caracteres`;
    }
    return '';
  }

  // Getter for form field states to use in template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field?.valid && field?.touched);
  }

  // Phone number formatting helper
  formatPhoneNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Simple Spanish phone formatting
    if (value.startsWith('34')) {
      value = '+34 ' + value.substring(2);
    } else if (value.length > 0 && !value.startsWith('+')) {
      value = '+34 ' + value;
    }
    
    this.contactForm.patchValue({ telefono: value });
  }
}

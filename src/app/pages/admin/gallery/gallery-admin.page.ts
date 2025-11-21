import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../services/auth.service';
import { MediaService } from '../../../services/media.service';
import { ProductsService } from '../../../services/products.service';
import { ImageOptimizationService } from '../../../services/image-optimization.service';
import { Product } from '../../../models/product';
import { Media, MediaTag, GALLERY_TAGS, MediaCreateInput } from '../../../models/media';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-gallery-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './gallery-admin.page.html',
  styleUrl: './gallery-admin.page.scss'
})
export class GalleryAdminComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private mediaService = inject(MediaService);
  private productsService = inject(ProductsService);
  private imageOptimization = inject(ImageOptimizationService);
  private cdr = inject(ChangeDetectorRef);

  mediaList: Media[] = [];
  products: Product[] = [];
  isLoading = true;
  showUploadModal = false;
  showEditModal = false;
  isSaving = false;
  uploadForm: FormGroup;
  editForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';  // Add warning for non-critical issues
  selectedTag: MediaTag | 'all' = 'all';
  searchTerm = '';
  showDeleteConfirm = false;
  mediaToDelete: Media | null = null;
  mediaToEdit: Media | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;
  isUploading = false;

  private previewFromFile = false;
  private selectedFile: File | null = null;
  private mediaSub: Subscription | null = null;
  private productsSub: Subscription | null = null;

  // Bulk upload properties
  selectedFiles: File[] = [];
  filePreviews: { file: File; url: string }[] = [];
  uploadedCount = 0;
  totalToUpload = 0;

  availableTags = GALLERY_TAGS;

  constructor() {
    this.uploadForm = this.fb.group({
      altText: [''],
      tags: [[]],
      relatedProductIds: [[]]
    });

    this.editForm = this.fb.group({
      altText: [''],
      tags: [[]],
      relatedProductIds: [[]]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.checkAdminAccess();
    this.subscribeToMedia();
    this.subscribeToProducts();
    
    // Check if we should auto-open upload modal
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'upload') {
        // Wait a bit for data to load, then open modal
        setTimeout(() => {
          this.openUploadModal();
        }, 500);
      }
    });
  }

  ngOnDestroy(): void {
    this.mediaSub?.unsubscribe();
    this.productsSub?.unsubscribe();
    this.revokePreviewUrl();
    this.revokeAllPreviewUrls();
  }

  private async checkAdminAccess(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/client/login']);
      return;
    }

    const isAdmin = await this.authService.isAdmin(user.uid);
    if (!isAdmin) {
      this.router.navigate(['/']);
    }
  }

  private subscribeToMedia(): void {
    this.isLoading = true;
    this.mediaSub?.unsubscribe();

    this.mediaSub = this.mediaService.getAllMedia().subscribe({
      next: (mediaList) => {
        this.mediaList = mediaList;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading media:', error);
        this.errorMessage = 'Error loading media files';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private subscribeToProducts(): void {
    this.productsSub?.unsubscribe();
    this.productsSub = this.productsService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products.filter(product => (product.status || 'draft') !== 'archived');
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  get filteredMedia(): Media[] {
    // Start with only gallery media (not product media)
    let filtered = this.mediaList.filter(m => m.relatedEntityType === 'gallery');

    // Filter by tag
    if (this.selectedTag !== 'all') {
      filtered = filtered.filter(media => media.tags.includes(this.selectedTag as MediaTag));
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(media =>
        media.altText?.toLowerCase().includes(term) ||
        media.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  getTagCount(tag: MediaTag | 'all'): number {
    // Filter only gallery media (relatedEntityType='gallery')
    const galleryMedia = this.mediaList.filter(m => m.relatedEntityType === 'gallery');
    
    if (tag === 'all') {
      return galleryMedia.length;
    }
    return galleryMedia.filter(media => media.tags.includes(tag)).length;
  }

  getRelatedProducts(media: Media): Product[] {
    if (!media.relatedEntityIds || media.relatedEntityIds.length === 0) {
      return [];
    }
    return this.products.filter(p => 
      media.relatedEntityIds!.some(id => id.endsWith(p.id || ''))
    );
  }

  openUploadModal(): void {
    this.showUploadModal = true;
    this.uploadForm.reset({
      altText: '',
      tags: [],
      relatedProductIds: []
    });
    this.selectedFile = null;
    this.selectedFiles = [];
    this.revokePreviewUrl();
    this.revokeAllPreviewUrls();
    this.successMessage = '';
    this.errorMessage = '';
    this.warningMessage = '';  // Clear warning
    this.uploadProgress = 0;
    this.uploadedCount = 0;
    this.totalToUpload = 0;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.uploadForm.reset();
    this.selectedFile = null;
    this.selectedFiles = [];
    this.revokePreviewUrl();
    this.revokeAllPreviewUrls();
    this.errorMessage = '';
    this.warningMessage = '';  // Clear warning
    this.uploadProgress = 0;
    this.uploadedCount = 0;
    this.totalToUpload = 0;
  }

  openEditModal(media: Media): void {
    this.mediaToEdit = media;
    this.showEditModal = true;
    this.editForm.patchValue({
      altText: media.altText || '',
      tags: media.tags || [],
      relatedProductIds: this.extractProductIds(media.relatedEntityIds || [])
    });
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.mediaToEdit = null;
    this.editForm.reset();
    this.errorMessage = '';
  }

  private extractProductIds(relatedEntityIds: string[]): string[] {
    return relatedEntityIds
      .filter(id => id.startsWith('products/'))
      .map(id => id.replace('products/', ''));
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.errorMessage = `${file.name} is not a valid image file`;
        continue;
      }

      if (file.size > maxSize) {
        this.errorMessage = `${file.name} is larger than 10MB`;
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      this.errorMessage = 'No valid image files selected';
      return;
    }

    // For backward compatibility, set first file as selectedFile
    this.selectedFile = validFiles[0];
    this.selectedFiles = validFiles;
    this.errorMessage = '';
    this.warningMessage = '';  // Clear warning when selecting new files

    // Revoke old previews
    this.revokePreviewUrl();
    this.revokeAllPreviewUrls();

    // Create previews for all files
    this.filePreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    // Set first preview as main preview for backward compatibility
    if (this.filePreviews.length > 0) {
      this.previewUrl = this.filePreviews[0].url;
      this.previewFromFile = true;
    }
  }

  toggleTag(tag: MediaTag, checked: boolean, isEdit = false): void {
    const form = isEdit ? this.editForm : this.uploadForm;
    const current = new Set<MediaTag>(form.get('tags')?.value || []);
    
    if (checked) {
      current.add(tag);
    } else {
      current.delete(tag);
    }
    
    form.patchValue({ tags: Array.from(current) });
  }

  isTagSelected(tag: MediaTag, isEdit = false): boolean {
    const form = isEdit ? this.editForm : this.uploadForm;
    const selected: MediaTag[] = form.get('tags')?.value || [];
    return selected.includes(tag);
  }

  toggleRelatedProduct(productId: string | undefined, checked: boolean, isEdit = false): void {
    const form = isEdit ? this.editForm : this.uploadForm;
    const current = new Set<string>(form.get('relatedProductIds')?.value || []);
    
    if (!productId) return;
    
    if (checked) {
      current.add(productId);
    } else {
      current.delete(productId);
    }
    
    form.patchValue({ relatedProductIds: Array.from(current) });
  }

  isProductSelected(productId: string | undefined, isEdit = false): boolean {
    const form = isEdit ? this.editForm : this.uploadForm;
    const selected: string[] = form.get('relatedProductIds')?.value || [];
    if (!productId) return false;
    return selected.includes(productId);
  }

  private revokePreviewUrl(): void {
    if (this.previewFromFile && this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.previewFromFile = false;
  }

  private revokeAllPreviewUrls(): void {
    this.filePreviews.forEach(preview => {
      URL.revokeObjectURL(preview.url);
    });
    this.filePreviews = [];
  }

  removeImage(index: number): void {
    if (index < 0 || index >= this.filePreviews.length) return;

    // Revoke URL
    URL.revokeObjectURL(this.filePreviews[index].url);
    
    // Remove from arrays
    this.filePreviews.splice(index, 1);
    this.selectedFiles.splice(index, 1);

    // Update selectedFile for backward compatibility
    if (this.selectedFiles.length > 0) {
      this.selectedFile = this.selectedFiles[0];
      this.previewUrl = this.filePreviews[0]?.url || null;
    } else {
      this.selectedFile = null;
      this.previewUrl = null;
      this.previewFromFile = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.isSaving || this.isUploading || this.selectedFiles.length === 0) {
      return;
    }

    if (this.uploadForm.invalid) {
      this.markFormGroupTouched(this.uploadForm);
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const formValue = this.uploadForm.value;
    const tags: MediaTag[] = formValue.tags || [];
    const relatedProductIds: string[] = formValue.relatedProductIds || [];
    const sharedAltText = formValue.altText || '';

    this.isUploading = true;
    this.isSaving = true;
    this.errorMessage = '';
    this.warningMessage = '';
    this.uploadProgress = 0;
    this.uploadedCount = 0;
    this.totalToUpload = this.selectedFiles.length;

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Upload all files in sequence (to avoid overwhelming Firebase)
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        
        try {
          // Optimize image before upload
          const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.85,
            outputFormat: 'webp'
          });
          
          const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
          console.log(`Gallery image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);
          
          // Validate image dimensions
          const validation = await this.mediaService.validateImageDimensions(optimizedFile, 1600, 1200);
          
          if (!validation.valid && !validation.width) {
            console.warn(`Skipping ${file.name}: ${validation.error}`);
            this.uploadedCount++;
            continue;
          }

          // For multiple files, append number to alt text if provided
          const altText = this.selectedFiles.length > 1 && sharedAltText
            ? `${sharedAltText} (${i + 1}/${this.selectedFiles.length})`
            : sharedAltText;

          const mediaInput: Omit<MediaCreateInput, 'url'> = {
            filename: optimizedFile.name,
            storagePath: `gallery/${Date.now()}_${optimizedFile.name}`,
            width: validation.width || 0,
            height: validation.height || 0,
            size: optimizedFile.size,
            mimeType: optimizedFile.type,
            uploadedBy: currentUser.uid,
            tags: tags as string[],
            altText: altText,
            relatedEntityIds: relatedProductIds.map(id => `products/${id}`),
            relatedEntityType: 'gallery'
          };

          // Upload file
          await this.mediaService.uploadMediaFile(
            optimizedFile,
            mediaInput,
            (progress) => {
              // Calculate overall progress
              const fileProgress = progress / this.totalToUpload;
              const completedProgress = (this.uploadedCount / this.totalToUpload) * 100;
              this.uploadProgress = Math.round(completedProgress + fileProgress);
            }
          );

          this.uploadedCount++;
          console.log(`✅ Uploaded ${this.uploadedCount}/${this.totalToUpload}: ${file.name} (${reduction}% smaller)`);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          this.uploadedCount++;
          // Continue with next file
        }
      }

      this.successMessage = `Successfully uploaded ${this.uploadedCount} image${this.uploadedCount !== 1 ? 's' : ''}`;
      this.uploadProgress = 100;
      this.closeUploadModal();

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error uploading media:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Error uploading media';
    } finally {
      this.isUploading = false;
      this.isSaving = false;
      this.selectedFiles = [];
      this.revokeAllPreviewUrls();
    }
  }

  async onEditSubmit(): Promise<void> {
    if (!this.mediaToEdit?.id || this.isSaving) {
      return;
    }

    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    const formValue = this.editForm.value;
    const tags: MediaTag[] = formValue.tags || [];
    const relatedProductIds: string[] = formValue.relatedProductIds || [];

    this.isSaving = true;
    this.errorMessage = '';

    try {
      await this.mediaService.updateMedia(this.mediaToEdit.id, {
        tags: tags as string[],
        altText: formValue.altText || '',
        relatedEntityIds: relatedProductIds.map(id => `products/${id}`)
      });

      this.successMessage = 'Media updated successfully';
      this.closeEditModal();
      this.cdr.detectChanges();

      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error updating media:', error);
      this.errorMessage = 'Error updating media';
      this.cdr.detectChanges();
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  openDeleteConfirm(media: Media): void {
    this.mediaToDelete = media;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.mediaToDelete = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.mediaToDelete?.id) return;

    this.isSaving = true;

    try {
      // For gallery images linked to products, automatically unlink them before deletion
      if (this.mediaToDelete.relatedEntityType === 'gallery' && 
          this.mediaToDelete.relatedEntityIds && 
          this.mediaToDelete.relatedEntityIds.length > 0) {
        
        // Extract product IDs from paths like 'products/apollo-white-12mm'
        const productIds = this.mediaToDelete.relatedEntityIds
          .map(id => id.replace('products/', ''))
          .filter(id => id); // Remove empty strings
        
        if (productIds.length > 0) {
          // Unlink image from all related products automatically
          for (const productId of productIds) {
            const product = this.products.find(p => p.id === productId);
            if (product && product.galleryImageIds) {
              const updatedGalleryIds = product.galleryImageIds.filter(
                imgId => imgId !== this.mediaToDelete!.id
              );
              
              // Update product to remove this image from gallery
              await this.productsService.updateProduct(productId, {
                galleryImageIds: updatedGalleryIds
              });
            }
          }
          
          this.warningMessage = `Image was automatically unlinked from ${productIds.length} product${productIds.length !== 1 ? 's' : ''} before deletion.`;
        }
      }

      // Delete media file from Storage and Firestore document
      await this.mediaService.deleteMediaWithFile(this.mediaToDelete.id);
      
      this.successMessage = 'Media deleted successfully';
      this.closeDeleteConfirm();
      this.cdr.detectChanges();

      setTimeout(() => {
        this.successMessage = '';
        this.warningMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error deleting media:', error);
      this.errorMessage = 'Error deleting media';
      this.cdr.detectChanges();
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Form getters
  get altText() { return this.uploadForm.get('altText'); }
  get tags() { return this.uploadForm.get('tags'); }
  get relatedProductIds() { return this.uploadForm.get('relatedProductIds'); }

  get editAltText() { return this.editForm.get('altText'); }
  get editTags() { return this.editForm.get('tags'); }
  get editRelatedProductIds() { return this.editForm.get('relatedProductIds'); }
}

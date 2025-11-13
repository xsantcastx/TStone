import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ProductsService } from '../../../services/products.service';
import { CategoryService } from '../../../services/category.service';
import { MaterialService } from '../../../services/material.service';
import { StorageService } from '../../../services/storage.service';
import { MediaService } from '../../../services/media.service';
import { ImageOptimizationService } from '../../../services/image-optimization.service';
import { Product } from '../../../models/product';
import { Category, Material } from '../../../models/catalog';
import { MediaCreateInput, MEDIA_VALIDATION } from '../../../models/media';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-quick-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './quick-add-product.page.html',
  styleUrl: './quick-add-product.page.scss'
})
export class QuickAddProductComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private categoryService = inject(CategoryService);
  private materialService = inject(MaterialService);
  private storageService = inject(StorageService);
  private mediaService = inject(MediaService);
  private imageOptimization = inject(ImageOptimizationService);

  categories: Category[] = [];
  materials: Material[] = [];
  filteredMaterials: Material[] = [];

  productForm: FormGroup;
  
  isSaving = false;
  isUploading = false;
  uploadProgress = 0;
  isEditMode = false;
  editingProductId: string | null = null;

  // Image upload
  selectedCoverFile: File | null = null;
  coverPreview: string | null = null;
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];
  
  // Store existing IDs when editing
  existingCoverImageId: string = '';
  existingGalleryImageIds: string[] = [];
  
  // Technical Specifications
  newSpecKey = '';
  newSpecValue = '';
  currentSpecs: Record<string, any> = {};
  
  // Dynamic creation
  showNewCategoryInput = false;
  showNewMaterialInput = false;
  newCategoryName = '';
  newMaterialName = '';
  
  // SEO Preview
  seoPreviewTitle = '';
  seoPreviewDescription = '';
  seoPreviewUrl = '';

  successMessage = '';
  errorMessage = '';

  constructor() {
    this.productForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      status: ['draft', Validators.required],
      description: [''],
      categoryId: ['', Validators.required],
      materialId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      size: ['160×320cm', Validators.required],
      finish: ['Pulido'],
      usage: ['Cocinas, Baños, Fachadas'],
      // SEO fields
      metaTitle: [''],
      metaDescription: [''],
      slug: ['']
    });
  }

  async ngOnInit() {
    await this.checkAuth();
    
    // Check if we're in edit mode
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.editingProductId = params['id'];
      }
    });
    
    await this.loadData();
    
    // Load product data if editing
    if (this.isEditMode && this.editingProductId) {
      await this.loadProductForEdit(this.editingProductId);
    }
    
    this.setupFormListeners();
  }

  private async checkAuth() {
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

  private async loadProductForEdit(productId: string) {
    try {
      const product = await firstValueFrom(this.productsService.getProduct(productId));
      if (!product) {
        this.errorMessage = 'Product not found';
        this.router.navigate(['/admin/products']);
        return;
      }

      // Populate form with product data
      this.productForm.patchValue({
        title: product.name || '',
        status: product.status || 'draft',
        description: product.description || '',
        categoryId: product.categoryId || '',
        materialId: product.materialId || '',
        price: product.price || 0,
        stock: product.stock || 0,
        sku: product.sku || '',
        size: product.specs?.size || product.size || '160×320cm',
        finish: product.specs?.finish || 'Pulido',
        usage: product.specs?.usage?.join(', ') || 'Cocinas, Baños, Fachadas',
        metaTitle: product.seo?.title || '',
        metaDescription: product.seo?.metaDescription || '',
        slug: product.slug || ''
      });

      // Load images - use imageUrl for preview, coverImage for Media ID
      if (product.imageUrl) {
        this.coverPreview = product.imageUrl;
        this.existingCoverImageId = product.coverImage || product.imageUrl;
      } else if (product.coverImage) {
        // If only coverImage exists, try to load the media URL
        try {
          const media = await this.mediaService.getMediaById(product.coverImage);
          if (media) {
            this.coverPreview = media.url;
            this.existingCoverImageId = product.coverImage;
          }
        } catch (error) {
          console.warn('Could not load cover image media:', error);
          this.existingCoverImageId = product.coverImage;
        }
      }

      // Load gallery images
      if (product.galleryImageIds && product.galleryImageIds.length > 0) {
        this.existingGalleryImageIds = product.galleryImageIds;
        
        // Load gallery image URLs for preview
        try {
          for (const mediaId of product.galleryImageIds) {
            const media = await this.mediaService.getMediaById(mediaId);
            if (media?.url) {
              this.galleryPreviews.push(media.url);
            }
          }
        } catch (error) {
          console.warn('Could not load gallery images:', error);
        }
      }

      // Load specs
      if (product.specs) {
        this.currentSpecs = { ...product.specs };
      }

      // Update SEO preview
      this.updateSEOPreview();
      
    } catch (error) {
      console.error('Error loading product:', error);
      this.errorMessage = 'Failed to load product';
    }
  }

  private async loadData() {
    try {
      // Load categories and materials
      const [categories, materials] = await Promise.all([
        firstValueFrom(this.categoryService.getActiveCategories()),
        firstValueFrom(this.materialService.getActiveMaterials())
      ]);

      this.categories = categories;
      this.materials = materials;
      this.filteredMaterials = materials;

      console.log('✅ Data loaded - Categories:', this.categories.length, 'Materials:', this.materials.length);
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load categories/materials. Please run seed first.';
    }
  }

  private setupFormListeners() {
    // Auto-generate slug from title
    this.productForm.get('title')?.valueChanges.subscribe(title => {
      if (title) {
        const slug = this.generateSlug(title);
        this.productForm.patchValue({ slug }, { emitEvent: false });
      }
      this.updateSEOPreview();
    });

    // Filter materials when category changes
    this.productForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId) {
        // You can add material filtering logic here if needed
        this.filteredMaterials = this.materials;
      }
      this.updateSEOPreview();
    });

    // Auto-generate SKU when material changes
    this.productForm.get('materialId')?.valueChanges.subscribe(materialId => {
      if (materialId && !this.isEditMode) {
        const material = this.materials.find(m => m.id === materialId);
        if (material) {
          const sku = this.generateSKU(material.name);
          this.productForm.patchValue({ sku }, { emitEvent: false });
        }
      }
    });

    // Update SEO preview on description change
    this.productForm.get('description')?.valueChanges.subscribe(() => {
      this.updateSEOPreview();
    });

    this.productForm.get('metaTitle')?.valueChanges.subscribe(() => {
      this.updateSEOPreview();
    });

    this.productForm.get('metaDescription')?.valueChanges.subscribe(() => {
      this.updateSEOPreview();
    });
  }

  private generateSlug(title: string): string {
    if (!title) return '';
    
    return title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateSKU(materialName: string): string {
    const prefix = materialName.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${random}`;
  }

  private updateSEOPreview() {
    const title = this.productForm.get('metaTitle')?.value || this.productForm.get('title')?.value || '';
    const description = this.productForm.get('metaDescription')?.value || 
                       this.productForm.get('description')?.value?.substring(0, 160) || '';
    const slug = this.productForm.get('slug')?.value || '';
    
    this.seoPreviewTitle = title || 'Product Title';
    this.seoPreviewDescription = description || 'Product description will appear here...';
    this.seoPreviewUrl = `https://topstone.com/productos/${slug || 'product-url'}`;
  }

  onCoverImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Removed size validation - optimization will handle large files
      this.selectedCoverFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.coverPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onGalleryImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    
    // Removed size validation - optimization will handle large files
    files.forEach(file => {
      this.galleryFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.galleryPreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }  removeGalleryImage(index: number) {
    this.galleryFiles.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
  }

  removeCoverImage() {
    this.selectedCoverFile = null;
    this.coverPreview = null;
    this.existingCoverImageId = '';
  }

  async saveProduct() {
    if (this.productForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      this.markFormGroupTouched(this.productForm);
      return;
    }

    try {
      this.isSaving = true;
      this.isUploading = true;
      this.uploadProgress = 0;

      // 1. Upload cover image (only if new file selected)
      let coverImageUrl = this.coverPreview || '';
      let coverImageId = this.existingCoverImageId || '';
      
      if (this.selectedCoverFile) {
        this.uploadProgress = 10;
        const uploadResult = await this.uploadImage(this.selectedCoverFile, 'cover');
        coverImageUrl = uploadResult.url;
        coverImageId = uploadResult.id;
      }

      // 2. Upload gallery images
      this.uploadProgress = 30;
      const galleryMediaIds: string[] = [...this.existingGalleryImageIds];
      
      if (this.galleryFiles.length > 0) {
        for (let i = 0; i < this.galleryFiles.length; i++) {
          const media = await this.uploadImage(this.galleryFiles[i], 'gallery');
          if (media.id) {
            galleryMediaIds.push(media.id);
          }
          this.uploadProgress = 30 + ((i + 1) / this.galleryFiles.length) * 50;
        }
      }

      this.isUploading = false;
      this.uploadProgress = 80;

      // 3. Prepare product data
      const formValue = this.productForm.value;

      // Get category for grosor
      const category = this.categories.find(c => c.id === formValue.categoryId);
      const grosor = category?.slug || '12mm';
      const slug = formValue.slug || this.generateSlug(formValue.title);

      const usageArray = formValue.usage 
        ? formValue.usage.split(',').map((u: string) => u.trim()).filter((u: string) => u) 
        : [];

      const productData: Partial<Product> = {
        name: formValue.title,
        slug: slug,
        description: formValue.description || '',
        categoryId: formValue.categoryId,
        materialId: formValue.materialId,
        price: parseFloat(formValue.price) || 0,
        stock: parseInt(formValue.stock) || 0,
        sku: formValue.sku || '',
        status: formValue.status,
        grosor: grosor as '12mm' | '15mm' | '20mm',
        size: formValue.size,
        active: formValue.status === 'published',
        specs: {
          grosor: grosor as '12mm' | '15mm' | '20mm',
          size: formValue.size,
          finish: formValue.finish,
          usage: usageArray,
          ...this.currentSpecs
        },
        coverImage: coverImageId,
        imageUrl: coverImageUrl,
        galleryImageIds: galleryMediaIds.length > 0 ? galleryMediaIds : undefined,
        seo: {
          title: formValue.metaTitle || formValue.title,
          metaDescription: formValue.metaDescription || formValue.description?.substring(0, 160),
          ogImage: coverImageUrl
        }
      };

      this.uploadProgress = 90;

      // 4. Create or Update product
      if (this.isEditMode && this.editingProductId) {
        await this.productsService.updateProduct(this.editingProductId, productData);
        this.successMessage = 'Product updated successfully!';
      } else {
        await this.productsService.addProduct(productData as Omit<Product, 'id'>);
        this.successMessage = 'Product created successfully!';
      }

      this.uploadProgress = 100;
      
      // Redirect to products list after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/admin/products']);
      }, 2000);

    } catch (error: any) {
      console.error('Error saving product:', error);
      this.errorMessage = error.message || 'Failed to save product';
    } finally {
      this.isSaving = false;
      this.isUploading = false;
    }
  }

  private async uploadImage(file: File, type: 'cover' | 'gallery'): Promise<{ url: string; id: string }> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Optimize image before upload
      const optimizedFile = await this.imageOptimization.optimizeImageAsFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        outputFormat: 'webp'
      });
      
      const reduction = this.imageOptimization.getSizeReduction(file.size, optimizedFile.size);
      console.log(`Product image optimized: ${this.imageOptimization.formatFileSize(file.size)} → ${this.imageOptimization.formatFileSize(optimizedFile.size)} (${reduction}% reduction)`);

      const category = this.categories.find(c => c.id === this.productForm.get('categoryId')?.value);
      const grosor = category?.slug || '12mm';
      const slug = this.productForm.get('slug')?.value || 'temp';

      // Upload to storage
      const downloadURL = await new Promise<string>((resolve, reject) => {
        this.storageService.uploadProductImage(optimizedFile, slug, grosor).subscribe({
          next: (progress) => {
            if (progress.downloadURL) {
              resolve(progress.downloadURL);
            }
          },
          error: reject
        });
      });

      // Get image dimensions
      const dimensions = await this.mediaService.getImageDimensions(optimizedFile);

      // Create media document
      const storagePath = `productos/${grosor}/${slug}/${optimizedFile.name}`;
      const mediaInput: MediaCreateInput = {
        url: downloadURL,
        filename: optimizedFile.name,
        storagePath: storagePath,
        width: dimensions.width,
        height: dimensions.height,
        size: optimizedFile.size,
        mimeType: optimizedFile.type,
        uploadedBy: user.uid,
        tags: [type, 'product'],
        relatedEntityType: 'product',
        relatedEntityIds: []
      };

      const mediaId = await this.mediaService.createMedia(mediaInput);
      return { url: downloadURL, id: mediaId };

    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Category dynamic creation
  onCategorySelectChange(event: any) {
    const value = event.target.value;
    if (value === '__new__') {
      this.showNewCategoryInput = true;
      this.productForm.patchValue({ categoryId: '' });
    }
  }

  async createNewCategory() {
    if (!this.newCategoryName.trim()) {
      return;
    }

    try {
      const slug = this.generateSlug(this.newCategoryName);
      const newCategory: Omit<Category, 'id'> = {
        name: this.newCategoryName.trim(),
        slug: slug,
        active: true,
        order: this.categories.length + 1
      };

      const categoryId = await this.categoryService.addCategory(newCategory);
      
      // Reload categories
      this.categories = await firstValueFrom(this.categoryService.getAllCategories());
      
      // Set the newly created category as selected
      this.productForm.patchValue({ categoryId: categoryId });
      
      // Reset
      this.showNewCategoryInput = false;
      this.newCategoryName = '';
      
      this.successMessage = 'Category created successfully!';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error creating category:', error);
      this.errorMessage = 'Failed to create category';
    }
  }

  cancelNewCategory() {
    this.showNewCategoryInput = false;
    this.newCategoryName = '';
  }

  // Material dynamic creation
  onMaterialSelectChange(event: any) {
    const value = event.target.value;
    if (value === '__new__') {
      this.showNewMaterialInput = true;
      this.productForm.patchValue({ materialId: '' });
    }
  }

  async createNewMaterial() {
    if (!this.newMaterialName.trim()) {
      return;
    }

    const categoryId = this.productForm.get('categoryId')?.value;
    if (!categoryId) {
      this.errorMessage = 'Please select a category first';
      return;
    }

    try {
      const slug = this.generateSlug(this.newMaterialName);
      const newMaterial: Omit<Material, 'id'> = {
        name: this.newMaterialName.trim(),
        slug: slug,
        active: true
      };

      const materialId = await this.materialService.addMaterial(newMaterial);
      
      // Reload materials
      this.materials = await firstValueFrom(this.materialService.getAllMaterials());
      this.filteredMaterials = this.materials;
      
      // Set the newly created material as selected
      this.productForm.patchValue({ materialId: materialId });
      
      // Reset
      this.showNewMaterialInput = false;
      this.newMaterialName = '';
      
      this.successMessage = 'Material created successfully!';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error creating material:', error);
      this.errorMessage = 'Failed to create material';
    }
  }

  cancelNewMaterial() {
    this.showNewMaterialInput = false;
    this.newMaterialName = '';
  }

  cancel() {
    this.router.navigate(['/admin/products']);
  }

  async logout() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  get statusOptions() {
    return [
      { value: 'published', label: 'Published' },
      { value: 'draft', label: 'Draft' },
      { value: 'archived', label: 'Archived' }
    ];
  }

  // Technical Specifications Management
  getCurrentSpecs(): Array<{key: string, value: any}> {
    if (!this.currentSpecs || Object.keys(this.currentSpecs).length === 0) {
      return [];
    }
    return Object.entries(this.currentSpecs).map(([key, value]) => ({ key, value }));
  }

  addSpec() {
    if (!this.newSpecKey || !this.newSpecValue) return;
    
    const key = this.newSpecKey.trim();
    const value = this.newSpecValue.trim();
    
    if (key && value) {
      this.currentSpecs[key] = value;
      this.newSpecKey = '';
      this.newSpecValue = '';
    }
  }

  removeSpec(key: string) {
    delete this.currentSpecs[key];
  }

  applySpecTemplate(template: { key: string; label: string; placeholder: string }) {
    this.newSpecKey = template.key;
    this.newSpecValue = '';
  }

  getSurfaceSpecTemplates() {
    return [
      { key: 'thickness', label: 'Thickness', placeholder: '12mm' },
      { key: 'dimensions', label: 'Dimensions', placeholder: '160×320cm' },
      { key: 'finish', label: 'Finish', placeholder: 'Pulido, Mate' },
      { key: 'application', label: 'Application', placeholder: 'Kitchen countertops' },
      { key: 'weight', label: 'Weight per m²', placeholder: '30 kg/m²' }
    ];
  }

  formatSpecLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

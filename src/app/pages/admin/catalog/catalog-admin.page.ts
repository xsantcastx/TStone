import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { CategoryService } from '../../../services/category.service';
import { MaterialService } from '../../../services/material.service';
import { SizeGroupService } from '../../../services/size-group.service';
import { Category, Material, Family, SizeGroup } from '../../../models/catalog';
import { AdminSidebarComponent } from '../../../shared/components/admin-sidebar/admin-sidebar.component';
import { firstValueFrom } from 'rxjs';

type TabType = 'categories' | 'materials' | 'families' | 'sizes';

@Component({
  selector: 'app-catalog-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, AdminSidebarComponent],
  templateUrl: './catalog-admin.page.html',
  styleUrl: './catalog-admin.page.scss'
})
export class CatalogAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private materialService = inject(MaterialService);
  private sizeGroupService = inject(SizeGroupService);
  private cdr = inject(ChangeDetectorRef);

  // Data
  categories: Category[] = [];
  materials: Material[] = [];
  families: Family[] = [];
  sizes: SizeGroup[] = [];

  // UI State
  activeTab: TabType = 'categories';
  isLoading = true;
  isSaving = false;
  
  // Modals
  showCategoryModal = false;
  showMaterialModal = false;
  showFamilyModal = false;
  showSizeModal = false;
  showDeleteConfirm = false;
  
  // Forms
  categoryForm: FormGroup;
  materialForm: FormGroup;
  familyForm: FormGroup;
  sizeForm: FormGroup;
  
  // Messages
  successMessage = '';
  errorMessage = '';
  
  // Edit mode
  editingCategory: Category | null = null;
  editingMaterial: Material | null = null;
  editingFamily: Family | null = null;
  editingSize: SizeGroup | null = null;
  itemToDelete: { type: TabType; id: string; name: string } | null = null;

  constructor() {
    // Initialize forms
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      order: [0],
      icon: [''],
      active: [true]
    });

    this.materialForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      textureHints: [''],
      defaultTags: [''],
      active: [true]
    });

    this.familyForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      materialId: [''],
      description: [''],
      order: [0],
      active: [true]
    });

    this.sizeForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      display: ['', Validators.required],
      thicknessDefaultMm: [null],
      active: [true]
    });
  }

  async ngOnInit() {
    await this.checkAdminAccess();
    await this.loadAllData();
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
    }
  }

  private async loadAllData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    try {
      const [categories, materials, sizes] = await Promise.all([
        firstValueFrom(this.categoryService.getAllCategories()),
        firstValueFrom(this.materialService.getAllMaterials()),
        firstValueFrom(this.sizeGroupService.getAllSizeGroups())
      ]);

      this.categories = categories;
      this.materials = materials;
      this.sizes = sizes;

      // TODO: Load families when service is ready
      this.families = [];
    } catch (error) {
      console.error('Error loading catalog data:', error);
      this.errorMessage = 'Error loading catalog data';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Tab switching
  switchTab(tab: TabType) {
    this.activeTab = tab;
    this.clearMessages();
  }

  // Category CRUD
  openCategoryModal(category?: Category) {
    this.editingCategory = category || null;
    
    if (category) {
      this.categoryForm.patchValue({
        name: category.name,
        slug: category.slug,
        order: category.order || 0,
        icon: category.icon || '',
        active: category.active !== false
      });
    } else {
      this.categoryForm.reset({ active: true, order: 0 });
    }
    
    this.showCategoryModal = true;
    this.clearMessages();
  }

  async saveCategory() {
    if (this.categoryForm.invalid) return;

    this.isSaving = true;
    this.clearMessages();

    try {
      const formValue = this.categoryForm.value;
      const categoryData: Category = {
        name: formValue.name,
        slug: formValue.slug,
        order: formValue.order || 0,
        icon: formValue.icon || undefined,
        active: formValue.active !== false
      };

      if (this.editingCategory?.id) {
        await this.categoryService.updateCategory(this.editingCategory.id, categoryData);
        this.successMessage = 'Category updated successfully';
      } else {
        await this.categoryService.addCategory(categoryData);
        this.successMessage = 'Category created successfully';
      }

      await this.loadAllData();
      this.isSaving = false;
      this.cdr.detectChanges();
      this.closeCategoryModal();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error saving category:', error);
      this.errorMessage = 'Error saving category';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  // Material CRUD
  openMaterialModal(material?: Material) {
    this.editingMaterial = material || null;
    
    if (material) {
      this.materialForm.patchValue({
        name: material.name,
        slug: material.slug,
        textureHints: material.textureHints?.join(', ') || '',
        defaultTags: material.defaultTags?.join(', ') || '',
        active: material.active !== false
      });
    } else {
      this.materialForm.reset({ active: true });
    }
    
    this.showMaterialModal = true;
    this.clearMessages();
  }

  async saveMaterial() {
    if (this.materialForm.invalid) return;

    this.isSaving = true;
    this.clearMessages();

    try {
      const formValue = this.materialForm.value;
      const materialData: Material = {
        name: formValue.name,
        slug: formValue.slug,
        textureHints: formValue.textureHints 
          ? formValue.textureHints.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : undefined,
        defaultTags: formValue.defaultTags
          ? formValue.defaultTags.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : undefined,
        active: formValue.active !== false
      };

      if (this.editingMaterial?.id) {
        await this.materialService.updateMaterial(this.editingMaterial.id, materialData);
        this.successMessage = 'Material updated successfully';
      } else {
        await this.materialService.addMaterial(materialData);
        this.successMessage = 'Material created successfully';
      }

      await this.loadAllData();
      this.isSaving = false;
      this.cdr.detectChanges();
      this.closeMaterialModal();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error saving material:', error);
      this.errorMessage = 'Error saving material';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  closeMaterialModal() {
    this.showMaterialModal = false;
    this.editingMaterial = null;
    this.materialForm.reset();
  }

  // Size CRUD
  openSizeModal(size?: SizeGroup) {
    this.editingSize = size || null;
    
    if (size) {
      this.sizeForm.patchValue({
        name: size.name,
        slug: size.slug,
        display: size.display,
        thicknessDefaultMm: size.thicknessDefaultMm || null,
        active: size.active !== false
      });
    } else {
      this.sizeForm.reset({ active: true });
    }
    
    this.showSizeModal = true;
    this.clearMessages();
  }

  async saveSize() {
    if (this.sizeForm.invalid) return;

    this.isSaving = true;
    this.clearMessages();

    try {
      const formValue = this.sizeForm.value;
      const sizeData: SizeGroup = {
        name: formValue.name,
        slug: formValue.slug,
        display: formValue.display,
        thicknessDefaultMm: formValue.thicknessDefaultMm || undefined,
        active: formValue.active !== false
      };

      if (this.editingSize?.id) {
        await this.sizeGroupService.updateSizeGroup(this.editingSize.id, sizeData);
        this.successMessage = 'Size group updated successfully';
      } else {
        await this.sizeGroupService.addSizeGroup(sizeData);
        this.successMessage = 'Size group created successfully';
      }

      await this.loadAllData();
      this.isSaving = false;
      this.cdr.detectChanges();
      this.closeSizeModal();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error saving size group:', error);
      this.errorMessage = 'Error saving size group';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  closeSizeModal() {
    this.showSizeModal = false;
    this.editingSize = null;
    this.sizeForm.reset();
  }

  // Delete confirmation
  confirmDelete(type: TabType, id: string, name: string) {
    this.itemToDelete = { type, id, name };
    this.showDeleteConfirm = true;
  }

  async executeDelete() {
    if (!this.itemToDelete) return;

    this.isSaving = true;
    this.clearMessages();

    try {
      const { type, id } = this.itemToDelete;

      switch (type) {
        case 'categories':
          await this.categoryService.deleteCategory(id);
          this.successMessage = 'Category deleted successfully';
          break;
        case 'materials':
          await this.materialService.deleteMaterial(id);
          this.successMessage = 'Material deleted successfully';
          break;
        case 'sizes':
          await this.sizeGroupService.deleteSizeGroup(id);
          this.successMessage = 'Size group deleted successfully';
          break;
        // TODO: Add family deletion
      }

      await this.loadAllData();
      this.isSaving = false;
      this.cdr.detectChanges();
      this.closeDeleteConfirm();
      
      setTimeout(() => {
        this.successMessage = '';
        this.cdr.detectChanges();
      }, 3000);
    } catch (error) {
      console.error('Error deleting item:', error);
      this.errorMessage = 'Error deleting item. It may be in use by products.';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.itemToDelete = null;
  }

  // Auto-generate slug from name
  generateSlug(formGroup: FormGroup) {
    const name = formGroup.get('name')?.value;
    if (name) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      formGroup.patchValue({ slug });
    }
  }

  // Helpers
  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
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

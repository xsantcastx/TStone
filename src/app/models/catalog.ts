import { Timestamp } from '@angular/fire/firestore';

export type Id = string;

// ===== Product & Variants =====

export interface Product {
  id?: Id;
  name: string;
  slug: string;
  categoryId: Id;
  materialId: Id;
  familyId?: Id;
  status: 'draft' | 'published' | 'archived';
  shortDescription?: string;
  description?: string;
  specs?: Specs;
  variantMode: 'embedded' | 'subcollection';
  variants?: ProductVariant[];
  coverImage?: string;                 // gs:// path or https
  galleryImageIds?: Id[];
  tags?: string[];
  seo?: Seo;
  metrics?: { views: number; favorites: number; };
  
  // Lock flags to prevent template overwrites
  descriptionLocked?: boolean;
  specsLocked?: boolean;
  seoLocked?: boolean;
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Specs {
  thicknessMm?: number;
  size?: string;
  finish?: string;
  waterAbsorption?: string;
  density?: string;
  usage?: string[];
  grosor?: '12mm' | '15mm' | '20mm';  // Keeping compatibility with current system
}

export interface ProductVariant {
  id?: Id;
  sku?: string;
  sizeGroupId?: Id;
  finish?: string;
  colorId?: Id;
  images?: string[];                   // gs:// or media ids
  price?: number | null;
  stock?: number;
  active?: boolean;
}

export interface Seo {
  title?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string[];
}

// ===== Categories =====

export interface Category {
  id?: Id;
  name: string;
  slug: string;
  order?: number;
  icon?: string;
  defaultSpecOverrides?: Partial<Specs>;
  descriptionTemplateId?: Id;
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ===== Materials =====

export interface Material {
  id?: Id;
  name: string;
  slug: string;
  textureHints?: string[];
  descriptionTemplateId?: Id;
  defaultTags?: string[];
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ===== Colors =====

export interface Color {
  id?: Id;
  name: string;
  slug: string;
  hex?: string;
  aliases?: string[];
  active?: boolean;
}

// ===== Sizes =====

export interface SizeGroup {
  id?: Id;
  name: string;        // '10 cm'
  slug: string;        // '10cm'
  display: string;     // '10x10 cm'
  thicknessDefaultMm?: number;
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ===== Templates =====

export interface Template {
  id?: Id;
  type: 'description' | 'seoTitle' | 'seoMeta' | 'specs';
  scope: 'material' | 'category' | 'family' | 'global';
  refId?: Id;          // ID of material/category/family if scoped
  language: 'es' | 'en' | 'fr' | 'it';
  content?: string;                     // for description/seo templates
  specDefaults?: Partial<Specs>;        // if type === 'specs'
  fields?: string[];                    // placeholders like {name}, {material}, {size}
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ===== Media =====

export interface Media {
  id?: Id;
  type: 'image' | 'video';
  bucketPath: string;
  publicUrl?: string;
  entityType?: 'product' | 'gallery' | 'category';
  entityId?: Id;
  tags?: string[];
  dimensions?: { w: number; h: number; };
  thumbnailUrl?: string;
  createdAt?: Timestamp;
  uploadedBy?: string;  // user ID
}

// ===== Gallery =====

export interface GalleryItem {
  id?: Id;
  title: string;
  slug: string;
  mediaId: Id;
  relatedProductIds?: Id[];
  tags?: string[];
  category?: string;  // baños, cocinas, fachadas, etc.
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ===== Families (Optional) =====

export interface Family {
  id?: Id;
  name: string;
  slug: string;
  materialId?: Id;
  order?: number;
  description?: string;
  active?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ===== Helper Types =====

export interface TemplateComposition {
  description?: string;
  seoTitle?: string;
  seoMeta?: string;
  specs?: Partial<Specs>;
  tags?: string[];
}

export interface ProductFormData {
  name: string;
  categoryId: Id;
  materialId: Id;
  sizeGroupId?: Id;
  familyId?: Id;
  shortDescription?: string;
  description?: string;
  specs?: Specs;
  price?: number;
  stock?: number;
  sku?: string;
  finish?: string;
  colorId?: Id;
  tags?: string[];
  seo?: Seo;
  active?: boolean;
}

// ===== Material Options (customizable "Material" dropdown) =====
export interface MaterialOption {
  id?: string;
  name: string;
  order?: number;
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

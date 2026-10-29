import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, writeBatch } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from '@angular/fire/storage';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Catalog {
  id?: string;
  name: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  uploadedBy?: string;
  version?: string;
  isLatest: boolean;
  /** Visible in public pages. Missing field is treated as public. */
  isPublic?: boolean;
  /** Catalog opened from the LUMINA nav item. At most one. */
  isLumina?: boolean;
  /** Download URL of the first-page thumbnail. */
  previewUrl?: string;
}

const isPublicCatalog = (c: Catalog): boolean => c.isPublic !== false;
const looksLikeLumina = (c: Catalog): boolean =>
  /lumina/i.test(c.name || '') || /lumina/i.test(c.fileName || '');

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private platformId = inject(PLATFORM_ID);
  
  private catalogsSubject = new BehaviorSubject<Catalog[]>([]);
  catalogs$ = this.catalogsSubject.asObservable();
  
  private latestCatalogSubject = new BehaviorSubject<Catalog | null>(null);
  latestCatalog$ = this.latestCatalogSubject.asObservable();

  /** Catalogs visible on public pages (isPublic !== false). */
  publicCatalogs$: Observable<Catalog[]> = this.catalogs$.pipe(
    map(list => list.filter(isPublicCatalog))
  );

  /** Catalog flagged isLumina, else first whose name/fileName contains "lumina". */
  luminaCatalog$: Observable<Catalog | null> = this.catalogs$.pipe(
    map(list => list.find(c => c.isLumina) || list.find(looksLikeLumina) || null)
  );

  constructor() {
    this.loadCatalogs();
  }

  async loadCatalogs(): Promise<void> {
    try {
      const catalogsRef = collection(this.firestore, 'catalogs');
      const q = query(catalogsRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const catalogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: (doc.data()['uploadedAt'] as Timestamp).toDate()
      } as Catalog));
      
      this.catalogsSubject.next(catalogs);
      
      // Set latest catalog
      const publics = catalogs.filter(isPublicCatalog);
      const latest = publics.find(c => c.isLatest) || publics[0] || null;
      this.latestCatalogSubject.next(latest);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  }

  async uploadCatalog(
    file: File, 
    name: string, 
    description: string = '',
    version: string = '',
    uploadedBy: string = '',
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // Upload file to Storage with progress tracking
      const timestamp = Date.now();
      const filename = `catalog-${timestamp}-${file.name}`;
      const storageRef = ref(this.storage, `catalogs/${filename}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Track upload progress
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => reject(error),
          () => resolve()
        );
      });
      
      const fileUrl = await getDownloadURL(storageRef);

      // Generate first-page preview (browser only, best effort)
      let previewUrl: string | undefined;
      try {
        const blob = await this.renderFirstPage(await file.arrayBuffer());
        if (blob) {
          previewUrl = await this.uploadPreview(blob, filename);
        }
      } catch (previewError) {
        console.warn('Could not generate catalog preview:', previewError);
      }
      
      // Get all catalogs and mark them as not latest
      const catalogsRef = collection(this.firestore, 'catalogs');
      const snapshot = await getDocs(catalogsRef);
      
      // Use batch to update existing catalogs
      const batch = writeBatch(this.firestore);
      snapshot.docs.forEach((docSnap) => {
        const catalogDoc = doc(this.firestore, 'catalogs', docSnap.id);
        batch.update(catalogDoc, { isLatest: false });
      });
      await batch.commit();
      
      // Add new catalog as latest
      await addDoc(catalogsRef, {
        name,
        description,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: Timestamp.now(),
        uploadedBy,
        version,
        isLatest: true,
        isPublic: true,
        ...(previewUrl ? { previewUrl } : {})
      });
      
      // Reload catalogs
      await this.loadCatalogs();
    } catch (error) {
      console.error('Error uploading catalog:', error);
      throw error;
    }
  }

  async deleteCatalog(catalogId: string, fileUrl: string): Promise<void> {
    try {
      // Delete from Firestore
      const catalogDoc = doc(this.firestore, 'catalogs', catalogId);
      await deleteDoc(catalogDoc);
      
      // Delete file from Storage
      try {
        const fileRef = ref(this.storage, fileUrl);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }
      
      // Reload catalogs
      await this.loadCatalogs();
    } catch (error) {
      console.error('Error deleting catalog:', error);
      throw error;
    }
  }

  async setLatestCatalog(catalogId: string): Promise<void> {
    try {
      const catalogsRef = collection(this.firestore, 'catalogs');
      const snapshot = await getDocs(catalogsRef);
      
      // Use batch to update all catalogs
      const batch = writeBatch(this.firestore);
      snapshot.docs.forEach((docSnap) => {
        const catalogDoc = doc(this.firestore, 'catalogs', docSnap.id);
        batch.update(catalogDoc, { isLatest: docSnap.id === catalogId });
      });
      await batch.commit();
      
      await this.loadCatalogs();
    } catch (error) {
      console.error('Error setting latest catalog:', error);
      throw error;
    }
  }

  /** Render page 1 of a PDF to a JPEG blob. Returns null on the server. */
  private async renderFirstPage(data: ArrayBuffer, targetWidth = 600): Promise<Blob | null> {
    if (!isPlatformBrowser(this.platformId)) return null;
    const pdfjs: any = await import('pdfjs-dist');
    // Run the worker on the main thread (single page render) to avoid bundler worker URL issues.
    if (!(globalThis as any).pdfjsWorker) {
      // @ts-ignore - no type declarations for the worker bundle
      (globalThis as any).pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
    }
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
    try {
      const page = await pdf.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: targetWidth / base.width });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    } finally {
      pdf.destroy();
    }
  }

  private async uploadPreview(blob: Blob, storedName: string): Promise<string> {
    const base = storedName.replace(/\.pdf$/i, '');
    const previewRef = ref(this.storage, `catalogs/previews/${base}.jpg`);
    await uploadBytesResumable(previewRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(previewRef);
  }

  /** Generate and save a preview for an existing catalog lacking previewUrl. */
  async generatePreview(catalog: Catalog): Promise<void> {
    if (!catalog.id) return;
    const response = await fetch(catalog.fileUrl);
    if (!response.ok) throw new Error(`No se pudo descargar el PDF (${response.status})`);
    const blob = await this.renderFirstPage(await response.arrayBuffer());
    if (!blob) throw new Error('No se pudo renderizar la vista previa');
    const name = `catalog-${Date.now()}-${(catalog.fileName || catalog.id).replace(/[^\w.-]+/g, '_')}`;
    const previewUrl = await this.uploadPreview(blob, name);
    await updateDoc(doc(this.firestore, 'catalogs', catalog.id), { previewUrl });
    await this.loadCatalogs();
  }

  async setVisibility(catalogIds: string[], isPublic: boolean): Promise<void> {
    if (!catalogIds.length) return;
    const batch = writeBatch(this.firestore);
    catalogIds.forEach(id => batch.update(doc(this.firestore, 'catalogs', id), { isPublic }));
    await batch.commit();
    await this.loadCatalogs();
  }

  /** Mark exactly one catalog as LUMINA (others unset). */
  async setLuminaCatalog(catalogId: string): Promise<void> {
    const snapshot = await getDocs(collection(this.firestore, 'catalogs'));
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach(d => {
      const current = d.data()['isLumina'] === true;
      const target = d.id === catalogId;
      if (current !== target) {
        batch.update(doc(this.firestore, 'catalogs', d.id), { isLumina: target });
      }
    });
    await batch.commit();
    await this.loadCatalogs();
  }
}

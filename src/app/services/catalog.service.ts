import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, writeBatch } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { BehaviorSubject, Observable } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  
  private catalogsSubject = new BehaviorSubject<Catalog[]>([]);
  catalogs$ = this.catalogsSubject.asObservable();
  
  private latestCatalogSubject = new BehaviorSubject<Catalog | null>(null);
  latestCatalog$ = this.latestCatalogSubject.asObservable();

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
      const latest = catalogs.find(c => c.isLatest) || catalogs[0] || null;
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
    uploadedBy: string = ''
  ): Promise<void> {
    try {
      // Upload file to Storage
      const timestamp = Date.now();
      const filename = `catalog-${timestamp}-${file.name}`;
      const storageRef = ref(this.storage, `catalogs/${filename}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      
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
        isLatest: true
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
}

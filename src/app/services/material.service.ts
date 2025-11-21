import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Material } from '../models/catalog';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private firestore = inject(Firestore);

  /**
   * Get all materials
   */
  getAllMaterials(): Observable<Material[]> {
    const materialsCollection = collection(this.firestore, 'materials');
    const q = query(materialsCollection, orderBy('name', 'asc'));
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Material))
      )
    );
  }

  /**
   * Get active materials only
   */
  getActiveMaterials(): Observable<Material[]> {
    const materialsCollection = collection(this.firestore, 'materials');
    const q = query(
      materialsCollection, 
      where('active', '==', true),
      orderBy('name', 'asc')
    );
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Material))
      )
    );
  }

  /**
   * Get single material by ID
   */
  getMaterial(id: string): Observable<Material | null> {
    const docRef = this.materialDoc(id);
    return from(getDoc(docRef)).pipe(
      map(doc => doc.exists() ? { id: doc.id, ...doc.data() as any } as Material : null)
    );
  }

  /**
   * Get material by slug
   */
  getMaterialBySlug(slug: string): Observable<Material | null> {
    const materialsCollection = collection(this.firestore, 'materials');
    const q = query(materialsCollection, where('slug', '==', slug));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() as any } as Material;
      })
    );
  }

  /**
   * Create new material
   */
  async addMaterial(material: Omit<Material, 'id'>): Promise<string> {
    const materialsCollection = collection(this.firestore, 'materials');
    const now = Timestamp.now();
    const data = {
      ...material,
      active: material.active !== false,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(materialsCollection, data as any);
    return docRef.id;
  }

  /**
   * Update existing material
   */
  async updateMaterial(id: string, updates: Partial<Material>): Promise<void> {
    const docRef = this.materialDoc(id);
    // Remove undefined values to avoid Firestore errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now()
    } as any);
  }

  /**
   * Delete material
   */
  async deleteMaterial(id: string): Promise<void> {
    const docRef = this.materialDoc(id);
    await deleteDoc(docRef);
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const materialsCollection = collection(this.firestore, 'materials');
    const q = query(materialsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    return true;
  }

  private materialDoc(id: string) {
    return doc(this.firestore, `materials/${id}`);
  }
}

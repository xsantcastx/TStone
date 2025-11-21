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
import { SizeGroup } from '../models/catalog';

@Injectable({ providedIn: 'root' })
export class SizeGroupService {
  private firestore = inject(Firestore);

  /**
   * Get all size groups
   */
  getAllSizeGroups(): Observable<SizeGroup[]> {
    const sizeGroupsCollection = collection(this.firestore, 'sizeGroups');
    const q = query(sizeGroupsCollection, orderBy('name', 'asc'));
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as SizeGroup))
      )
    );
  }

  /**
   * Get active size groups only
   */
  getActiveSizeGroups(): Observable<SizeGroup[]> {
    const sizeGroupsCollection = collection(this.firestore, 'sizeGroups');
    const q = query(
      sizeGroupsCollection, 
      where('active', '==', true),
      orderBy('name', 'asc')
    );
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as SizeGroup))
      )
    );
  }

  /**
   * Get single size group by ID
   */
  getSizeGroup(id: string): Observable<SizeGroup | null> {
    const docRef = this.sizeGroupDoc(id);
    return from(getDoc(docRef)).pipe(
      map(doc => doc.exists() ? { id: doc.id, ...doc.data() as any } as SizeGroup : null)
    );
  }

  /**
   * Get size group by slug
   */
  getSizeGroupBySlug(slug: string): Observable<SizeGroup | null> {
    const sizeGroupsCollection = collection(this.firestore, 'sizeGroups');
    const q = query(sizeGroupsCollection, where('slug', '==', slug));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() as any } as SizeGroup;
      })
    );
  }

  /**
   * Create new size group
   */
  async addSizeGroup(sizeGroup: Omit<SizeGroup, 'id'>): Promise<string> {
    const sizeGroupsCollection = collection(this.firestore, 'sizeGroups');
    const now = Timestamp.now();
    const data = {
      ...sizeGroup,
      active: sizeGroup.active !== false,
      createdAt: now,
      updatedAt: now
    };
    const docRef = await addDoc(sizeGroupsCollection, data as any);
    return docRef.id;
  }

  /**
   * Update existing size group
   */
  async updateSizeGroup(id: string, updates: Partial<SizeGroup>): Promise<void> {
    const docRef = this.sizeGroupDoc(id);
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
   * Delete size group
   */
  async deleteSizeGroup(id: string): Promise<void> {
    const docRef = this.sizeGroupDoc(id);
    await deleteDoc(docRef);
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const sizeGroupsCollection = collection(this.firestore, 'sizeGroups');
    const q = query(sizeGroupsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    return true;
  }

  private sizeGroupDoc(id: string) {
    return doc(this.firestore, `sizeGroups/${id}`);
  }
}

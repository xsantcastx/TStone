import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp
} from '@angular/fire/firestore';
import { MaterialOption } from '../models/catalog';

/**
 * Customizable "Material" options for products (collection: materialOptions).
 * Independent from the legacy `materials` collection (shown as "Artículo").
 */
@Injectable({ providedIn: 'root' })
export class MaterialOptionService {
  private firestore = inject(Firestore);
  private nameMapCache?: Promise<Map<string, string>>;

  /** Cached id → name map, so product listings resolve tags with a single read. */
  getNameMap(): Promise<Map<string, string>> {
    this.nameMapCache ??= this.list()
      .then(options => new Map(options.map(o => [o.id!, o.name])))
      .catch(() => {
        this.nameMapCache = undefined;
        return new Map<string, string>();
      });
    return this.nameMapCache;
  }

  /** Material tag ids for a product, falling back to the legacy single-select field. */
  static idsOf(product: { materialOptionIds?: string[]; materialOptionId?: string } | null | undefined): string[] {
    if (!product) return [];
    if (Array.isArray(product.materialOptionIds)) return product.materialOptionIds;
    return product.materialOptionId ? [product.materialOptionId] : [];
  }

  /** Resolved tag names for a product (unknown/deleted ids are skipped). */
  async namesFor(product: { materialOptionIds?: string[]; materialOptionId?: string } | null | undefined): Promise<string[]> {
    const ids = MaterialOptionService.idsOf(product);
    if (!ids.length) return [];
    const names = await this.getNameMap();
    return ids.map(id => names.get(id)).filter((n): n is string => !!n);
  }

  /** List options sorted by order then name (sorted client-side to avoid composite indexes). */
  async list(): Promise<MaterialOption[]> {
    const snapshot = await getDocs(collection(this.firestore, 'materialOptions'));
    return snapshot.docs
      .map(d => ({ id: d.id, ...(d.data() as any) } as MaterialOption))
      .filter(o => o.active !== false)
      .sort((a, b) => {
        const oa = a.order ?? Number.MAX_SAFE_INTEGER;
        const ob = b.order ?? Number.MAX_SAFE_INTEGER;
        return oa !== ob ? oa - ob : (a.name || '').localeCompare(b.name || '');
      });
  }

  async add(name: string, order?: number): Promise<string> {
    const now = Timestamp.now();
    const data: any = { name: name.trim(), active: true, createdAt: now, updatedAt: now };
    if (order !== undefined) data.order = order;
    this.nameMapCache = undefined;
    const ref = await addDoc(collection(this.firestore, 'materialOptions'), data);
    return ref.id;
  }

  async update(id: string, updates: Partial<MaterialOption>): Promise<void> {
    const clean = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    this.nameMapCache = undefined;
    await updateDoc(doc(this.firestore, `materialOptions/${id}`), { ...clean, updatedAt: Timestamp.now() } as any);
  }

  async delete(id: string): Promise<void> {
    this.nameMapCache = undefined;
    await deleteDoc(doc(this.firestore, `materialOptions/${id}`));
  }
}

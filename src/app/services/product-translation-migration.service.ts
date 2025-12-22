import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class ProductTranslationMigrationService {
  private firestore = inject(Firestore);
  private translationService = inject(TranslationService);

  /**
   * Migrate all products: translate Spanish content to EN/FR/IT
   */
  async migrateAllProducts(): Promise<{ success: number; failed: number; skipped: number }> {
    const stats = { success: 0, failed: 0, skipped: 0 };

    try {
      const productsRef = collection(this.firestore, 'products');
      const snapshot = await getDocs(productsRef);

      console.log(`Found ${snapshot.size} products to process`);

      for (const docSnap of snapshot.docs) {
        const product = docSnap.data();
        const productId = docSnap.id;

        // Skip if already has translations
        if (product['descriptionTranslations']?.en) {
          console.log(`⊘ Skipping ${product['name']} - already translated`);
          stats.skipped++;
          continue;
        }

        try {
          console.log(`🔄 Processing: ${product['name']}...`);
          
          const translations = await this.translationService.translateProductFields(product);
          
          // Update Firestore
          const productRef = doc(this.firestore, 'products', productId);
          await updateDoc(productRef, translations);

          console.log(`✅ Successfully translated: ${product['name']}`);
          stats.success++;

        } catch (error) {
          console.error(`❌ Failed to translate ${product['name']}:`, error);
          stats.failed++;
        }

        // Add delay between products to avoid rate limiting
        await this.delay(1000);
      }

      console.log('\n📊 Migration Summary:');
      console.log(`✅ Success: ${stats.success}`);
      console.log(`❌ Failed: ${stats.failed}`);
      console.log(`⊘ Skipped: ${stats.skipped}`);

      return stats;

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate a single product by ID
   */
  async migrateSingleProduct(productId: string): Promise<void> {
    try {
      const productRef = doc(this.firestore, 'products', productId);
      const productSnap = await import('@angular/fire/firestore').then(m => m.getDoc(productRef));

      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }

      const product = productSnap.data();
      console.log(`🔄 Translating: ${product['name']}...`);

      const translations = await this.translationService.translateProductFields(product);
      await updateDoc(productRef, translations);

      console.log(`✅ Successfully translated: ${product['name']}`);
    } catch (error) {
      console.error('Failed to translate product:', error);
      throw error;
    }
  }

  /**
   * Re-translate products that already have translations (force update)
   */
  async retranslateAll(): Promise<{ success: number; failed: number }> {
    const stats = { success: 0, failed: 0 };

    try {
      const productsRef = collection(this.firestore, 'products');
      const snapshot = await getDocs(productsRef);

      for (const docSnap of snapshot.docs) {
        const product = docSnap.data();
        const productId = docSnap.id;

        try {
          const translations = await this.translationService.translateProductFields(product);
          const productRef = doc(this.firestore, 'products', productId);
          await updateDoc(productRef, translations);

          stats.success++;
        } catch (error) {
          console.error(`Failed to retranslate ${product['name']}:`, error);
          stats.failed++;
        }

        await this.delay(1000);
      }

      return stats;
    } catch (error) {
      console.error('Retranslation failed:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { TranslationService } from './translation.service';
import { TranslatedTextMap } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class GalleryTranslationMigrationService {
  private firestore = inject(Firestore);
  private translationService = inject(TranslationService);

  /**
   * Migrate all gallery images: translate Spanish content to EN/FR/IT
   */
  async migrateAllGalleryImages(): Promise<{ success: number; failed: number; skipped: number }> {
    const stats = { success: 0, failed: 0, skipped: 0 };

    try {
      const imagesRef = collection(this.firestore, 'galleryImages');
      const snapshot = await getDocs(imagesRef);

      console.log(`Found ${snapshot.size} gallery images to process`);

      for (const docSnap of snapshot.docs) {
        const image = docSnap.data();
        const imageId = docSnap.id;

        // Skip if already has translations
        if (image['titleTranslations']?.en || image['descriptionTranslations']?.en) {
          console.log(`⊘ Skipping gallery image ${imageId} - already translated`);
          stats.skipped++;
          continue;
        }

        try {
          console.log(`🔄 Processing gallery image: ${imageId}...`);
          
          const updates: any = {};

          // Translate title if exists
          if (image['title']) {
            const titleTranslations = await this.translationService.translateToAllLanguages(image['title']);
            updates.titleTranslations = titleTranslations;
          }

          // Translate description if exists
          if (image['description']) {
            const descTranslations = await this.translationService.translateToAllLanguages(image['description']);
            updates.descriptionTranslations = descTranslations;
          }

          // Translate project if exists
          if (image['project']) {
            const projectTranslations = await this.translationService.translateToAllLanguages(image['project']);
            updates.projectTranslations = projectTranslations;
          }

          // Translate location if exists
          if (image['location']) {
            const locationTranslations = await this.translationService.translateToAllLanguages(image['location']);
            updates.locationTranslations = locationTranslations;
          }

          if (Object.keys(updates).length > 0) {
            const imageRef = doc(this.firestore, 'galleryImages', imageId);
            await updateDoc(imageRef, updates);

            console.log(`✅ Successfully translated gallery image: ${imageId}`);
            stats.success++;
          } else {
            stats.skipped++;
          }

        } catch (error) {
          console.error(`❌ Failed to translate gallery image ${imageId}:`, error);
          stats.failed++;
        }

        // Add delay between images
        await this.delay(1000);
      }

      console.log('\n📊 Gallery Migration Summary:');
      console.log(`✅ Success: ${stats.success}`);
      console.log(`❌ Failed: ${stats.failed}`);
      console.log(`⊘ Skipped: ${stats.skipped}`);

      return stats;

    } catch (error) {
      console.error('Gallery migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate gallery categories
   */
  async migrateGalleryCategories(): Promise<{ success: number; failed: number; skipped: number }> {
    const stats = { success: 0, failed: 0, skipped: 0 };

    try {
      const categoriesRef = collection(this.firestore, 'galleryCategories');
      const snapshot = await getDocs(categoriesRef);

      console.log(`Found ${snapshot.size} gallery categories to process`);

      for (const docSnap of snapshot.docs) {
        const category = docSnap.data();
        const categoryId = docSnap.id;

        if (category['nameTranslations']?.en || category['descriptionTranslations']?.en) {
          console.log(`⊘ Skipping category ${category['name']} - already translated`);
          stats.skipped++;
          continue;
        }

        try {
          console.log(`🔄 Processing category: ${category['name']}...`);
          
          const updates: any = {};

          if (category['name']) {
            const nameTranslations = await this.translationService.translateToAllLanguages(category['name']);
            updates.nameTranslations = nameTranslations;
          }

          if (category['description']) {
            const descTranslations = await this.translationService.translateToAllLanguages(category['description']);
            updates.descriptionTranslations = descTranslations;
          }

          if (Object.keys(updates).length > 0) {
            const categoryRef = doc(this.firestore, 'galleryCategories', categoryId);
            await updateDoc(categoryRef, updates);

            console.log(`✅ Successfully translated category: ${category['name']}`);
            stats.success++;
          } else {
            stats.skipped++;
          }

        } catch (error) {
          console.error(`❌ Failed to translate category ${category['name']}:`, error);
          stats.failed++;
        }

        await this.delay(1000);
      }

      return stats;

    } catch (error) {
      console.error('Category migration failed:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

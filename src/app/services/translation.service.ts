import { Injectable } from '@angular/core';

export type Language = 'es' | 'en' | 'fr' | 'it';

interface TranslationResult {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  /**
   * Auto-translate text from Spanish to target languages using MyMemory Translation API (free, no key required)
   */
  async translateText(text: string, targetLang: Language): Promise<string> {
    if (!text || targetLang === 'es') {
      return text;
    }

    try {
      // Using MyMemory Translation API - free tier, no API key needed
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|${targetLang}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }

      console.warn(`Translation failed for "${text}" to ${targetLang}:`, data);
      return text; // Fallback to original
    } catch (error) {
      console.error(`Translation error for ${targetLang}:`, error);
      return text; // Fallback to original
    }
  }

  /**
   * Translate text to all languages (EN, FR, IT)
   */
  async translateToAllLanguages(spanishText: string): Promise<TranslationResult> {
    const languages: Language[] = ['en', 'fr', 'it'];
    const translations: TranslationResult = {
      es: spanishText
    };

    // Translate to each language sequentially (to avoid rate limiting)
    for (const lang of languages) {
      // Add small delay to be respectful to the free API
      await this.delay(500);
      translations[lang] = await this.translateText(spanishText, lang);
    }

    return translations;
  }

  /**
   * Batch translate multiple texts to all languages
   */
  async batchTranslate(texts: { [key: string]: string }): Promise<{ [key: string]: TranslationResult }> {
    const results: { [key: string]: TranslationResult } = {};

    for (const [key, text] of Object.entries(texts)) {
      if (text && text.trim()) {
        results[key] = await this.translateToAllLanguages(text);
        // Add delay between different fields
        await this.delay(300);
      }
    }

    return results;
  }

  /**
   * Helper to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Translate product fields from Spanish
   */
  async translateProductFields(product: any): Promise<any> {
    console.log(`Translating product: ${product.name}...`);

    const updates: any = {};

    // Translate description
    if (product.description) {
      const descTranslations = await this.translateToAllLanguages(product.description);
      updates.descriptionTranslations = descTranslations;
    }

    // Translate SEO title
    if (product.seoTitle) {
      const seoTitleTranslations = await this.translateToAllLanguages(product.seoTitle);
      updates.seoTitleTranslations = seoTitleTranslations;
    }

    // Translate SEO description
    if (product.seoDescription) {
      const seoDescTranslations = await this.translateToAllLanguages(product.seoDescription);
      updates.seoDescriptionTranslations = seoDescTranslations;
    }

    console.log(`✓ Translated product: ${product.name}`);
    return updates;
  }
}

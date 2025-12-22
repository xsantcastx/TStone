import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { TranslationService } from './translation.service';
import { TranslatedTextMap } from '../models/product';
import { 
  DatosTecnicosData, 
  AcabadoSuperficie, 
  FichaTecnica, 
  AcabadoBorde,
  TestResult
} from '../core/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class DatosTecnicosTranslationService {
  private firestore = inject(Firestore);
  private translationService = inject(TranslationService);

  /**
   * Migrate datos tecnicos document: translate all Spanish content to EN/FR/IT
   */
  async migrateDatosTecnicos(): Promise<{ success: boolean; message: string }> {
    try {
      const datosTecnicosRef = doc(this.firestore, 'content', 'datos-tecnicos');
      const snapshot = await getDoc(datosTecnicosRef);

      if (!snapshot.exists()) {
        throw new Error('Datos técnicos document not found');
      }

      const data = snapshot.data() as DatosTecnicosData;

      console.log('🔄 Starting datos técnicos translation...');

      const updates: Partial<DatosTecnicosData> = {};

      // 1. Translate acabados superficie
      if (data.acabadosSuperficie && data.acabadosSuperficie.length > 0) {
        console.log('Translating acabados superficie...');
        updates.acabadosSuperficie = await this.translateAcabados(data.acabadosSuperficie);
      }

      // 2. Translate fichas técnicas
      if (data.fichasTecnicas && data.fichasTecnicas.length > 0) {
        console.log('Translating fichas técnicas...');
        updates.fichasTecnicas = await this.translateFichas(data.fichasTecnicas);
      }

      // 3. Translate especificaciones técnicas
      if (data.especificacionesTecnicas) {
        console.log('Translating especificaciones técnicas...');
        updates.especificacionesTecnicasTranslations = await this.translateEspecificaciones(data.especificacionesTecnicas);
      }

      // 4. Translate acabados bordes
      if (data.acabadosBordes && data.acabadosBordes.length > 0) {
        console.log('Translating acabados bordes...');
        updates.acabadosBordes = await this.translateBordes(data.acabadosBordes);
      }

      // 5. Translate fijaciones fachada
      if (data.fijacionesFachada?.descripcion) {
        console.log('Translating fijaciones fachada...');
        const descripcionTranslations = await this.translationService.translateToAllLanguages(
          data.fijacionesFachada.descripcion
        );
        updates.fijacionesFachada = {
          ...data.fijacionesFachada,
          descripcionTranslations
        };
      }

      // 6. Translate mantenimiento
      if (data.mantenimiento) {
        console.log('Translating mantenimiento...');
        const limpiezaTranslations = data.mantenimiento.limpieza ? 
          await this.translationService.translateToAllLanguages(data.mantenimiento.limpieza) : {};
        const frecuenciaTranslations = data.mantenimiento.frecuencia ?
          await this.translationService.translateToAllLanguages(data.mantenimiento.frecuencia) : {};

        updates.mantenimiento = {
          ...data.mantenimiento,
          limpiezaTranslations,
          frecuenciaTranslations
        };
      }

      // 7. Translate test results
      if (data.testResults && data.testResults.length > 0) {
        console.log('Translating test results...');
        updates.testResults = await this.translateTestResults(data.testResults);
      }

      // 8. Translate packing description if exists
      if (data.packingDescripcion) {
        console.log('Translating packing description...');
        updates.packingDescripcionTranslations = await this.translationService.translateToAllLanguages(
          data.packingDescripcion
        );
      }

      // Update Firestore
      await setDoc(datosTecnicosRef, updates, { merge: true });

      console.log('✅ Datos técnicos translation complete!');

      return {
        success: true,
        message: 'Successfully translated all technical data fields'
      };

    } catch (error) {
      console.error('❌ Datos técnicos translation failed:', error);
      return {
        success: false,
        message: `Translation failed: ${error}`
      };
    }
  }

  private async translateAcabados(acabados: AcabadoSuperficie[]): Promise<AcabadoSuperficie[]> {
    const translated: AcabadoSuperficie[] = [];

    for (const acabado of acabados) {
      const descripcionTranslations = acabado.descripcion ?
        await this.translationService.translateToAllLanguages(acabado.descripcion) : {};
      
      const altTranslations = acabado.alt ?
        await this.translationService.translateToAllLanguages(acabado.alt) : {};

      translated.push({
        ...acabado,
        descripcionTranslations,
        altTranslations
      });

      await this.delay(500);
    }

    return translated;
  }

  private async translateFichas(fichas: FichaTecnica[]): Promise<FichaTecnica[]> {
    const translated: FichaTecnica[] = [];

    for (const ficha of fichas) {
      const descripcionTranslations = ficha.descripcion ?
        await this.translationService.translateToAllLanguages(ficha.descripcion) : {};

      translated.push({
        ...ficha,
        descripcionTranslations
      });

      await this.delay(500);
    }

    return translated;
  }

  private async translateEspecificaciones(specs: Record<string, string>): Promise<Record<string, TranslatedTextMap>> {
    const translations: Record<string, TranslatedTextMap> = {};

    for (const [key, value] of Object.entries(specs)) {
      if (value && typeof value === 'string') {
        translations[key] = await this.translationService.translateToAllLanguages(value);
        await this.delay(300);
      }
    }

    return translations;
  }

  private async translateBordes(bordes: AcabadoBorde[]): Promise<AcabadoBorde[]> {
    const translated: AcabadoBorde[] = [];

    for (const borde of bordes) {
      const descripcionTranslations = borde.descripcion ?
        await this.translationService.translateToAllLanguages(borde.descripcion) : {};
      
      const altTranslations = borde.alt ?
        await this.translationService.translateToAllLanguages(borde.alt) : {};

      translated.push({
        ...borde,
        descripcionTranslations,
        altTranslations
      });

      await this.delay(500);
    }

    return translated;
  }

  private async translateTestResults(results: TestResult[]): Promise<TestResult[]> {
    const translated: TestResult[] = [];

    for (const result of results) {
      const nombreTranslations = result.nombre ?
        await this.translationService.translateToAllLanguages(result.nombre) : {};

      translated.push({
        ...result,
        nombreTranslations
      });

      await this.delay(500);
    }

    return translated;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

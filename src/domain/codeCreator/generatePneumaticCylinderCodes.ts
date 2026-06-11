import {
  getPneumaticCylinderCodeTemplate,
  PNEUMATIC_CATALOG_ORDER_KEY_SERIES_IDS,
  pickPneumaticCatalogCodeCandidate,
} from '@/domain/categories/pneumaticCylinder/pneumaticCylinderSuggestedCode';
import {
  resolveSeriesCushioningToken,
  resolveSeriesExtraToken,
  resolveSeriesRodEndToken,
  resolveSeriesSensorToken,
} from '@/domain/codeCreator/pneumaticCreatorCatalogOptions';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getEquivalentGroups, getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { seriesMatchesBrandFilter } from '@/domain/codeCreator/getCodeCreatorSchema';
import type {
  CodeCreatorBrandKey,
  CodeCreatorSelections,
  GeneratedProductCode,
} from '@/types/productCodeCreator';
import type { ProductSeriesRecord } from '@/types/product';

const PNEUMATIC_EQUIVALENCE_GROUP_ID = 'pneumatic_iso_15552_cylinder';

function applyTemplate(template: string, bore: number, stroke: number, codePrefix: string): string {
  return template
    .replace(/\{bore\}/g, String(bore))
    .replace(/\{stroke\}/g, String(stroke))
    .replace(/\{prefix\}/g, codePrefix);
}

function parsePositiveInt(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function shouldUseCatalogOrderKeyTemplate(
  seriesId: string,
  selections: CodeCreatorSelections
): boolean {
  if (PNEUMATIC_CATALOG_ORDER_KEY_SERIES_IDS.has(seriesId)) {
    return true;
  }

  if (selections.cushioning_type === 'with') {
    return true;
  }

  if (seriesId === 'festo_adn' || seriesId === 'festo_dsnu') {
    return (
      selections.sensor_option === 'with' ||
      (selections.rod_end_option != null && selections.rod_end_option !== 'none')
    );
  }

  return false;
}

function appendSuffixTokens(
  baseCode: string,
  seriesId: string,
  selections: CodeCreatorSelections
): { code: string; notes: string[] } {
  const suffixParts: string[] = [];
  const notes: string[] = [];

  const cushioningToken = resolveSeriesCushioningToken(seriesId, selections.cushioning_type);
  if (cushioningToken) {
    suffixParts.push(cushioningToken);
  } else if (selections.cushioning_type === 'with') {
    notes.push('Bu seri için katalogda sönümleme kodu bulunamadı; yastıklama eklenmedi.');
  }

  const sensorToken = resolveSeriesSensorToken(seriesId, selections.sensor_option);
  if (sensorToken) {
    suffixParts.push(sensorToken);
  } else if (selections.sensor_option === 'with') {
    notes.push('Bu seri için sensör kodu basit şablona eklenemedi; katalogdan doğrulanmalıdır.');
  }

  const rodEndToken = resolveSeriesRodEndToken(seriesId, selections.rod_end_option);
  if (rodEndToken) {
    suffixParts.push(rodEndToken);
  } else if (selections.rod_end_option && selections.rod_end_option !== 'none') {
    notes.push(
      'Seçilen mil ucu tipi bu seri için basit şablona eklenemedi; katalogdan doğrulanmalıdır.'
    );
  }

  const extraToken = resolveSeriesExtraToken(seriesId, selections.extra_option);
  if (extraToken) {
    suffixParts.push(extraToken);
  } else if (selections.extra_option && selections.extra_option !== 'none') {
    notes.push('Seçilen ek seçenek bu seri için uygulanamadı.');
  }

  if (suffixParts.length === 0) {
    return { code: baseCode, notes };
  }

  return { code: `${baseCode}-${suffixParts.join('-')}`, notes };
}

function buildPneumaticCreatorCode(
  series: ProductSeriesRecord,
  bore: number,
  stroke: number,
  selections: CodeCreatorSelections
): { code: string; notes: string[]; catalogDerived: boolean } {
  const cushioningToken = resolveSeriesCushioningToken(series.id, selections.cushioning_type);

  if (shouldUseCatalogOrderKeyTemplate(series.id, selections)) {
    const catalogCandidate = pickPneumaticCatalogCodeCandidate(series, bore, stroke, {
      cushioningToken: cushioningToken ?? undefined,
    });

    if (catalogCandidate?.code) {
      const notes: string[] = [];
      if (catalogCandidate.needsReview) {
        notes.push(
          'Katalog order-key şablonundan türetildi; sipariş öncesi üretici kataloğu ile doğrulanmalıdır.'
        );
      }
      return {
        code: catalogCandidate.code,
        notes,
        catalogDerived: true,
      };
    }
  }

  const template = getPneumaticCylinderCodeTemplate(series);
  const baseCode = applyTemplate(template, bore, stroke, series.codePrefix);
  const { code, notes } = appendSuffixTokens(baseCode, series.id, selections);

  return { code, notes, catalogDerived: false };
}

export function generatePneumaticCylinderCodes(options: {
  brandFilter: CodeCreatorBrandKey | null;
  selections: CodeCreatorSelections;
}): { codes: GeneratedProductCode[]; checkNotes: string[] } {
  const bore = parsePositiveInt(options.selections.bore);
  const stroke = parsePositiveInt(options.selections.stroke);
  const checkNotes: string[] = [];

  if (!bore) {
    checkNotes.push('Çap seçilmedi veya geçersiz.');
  }
  if (!stroke) {
    checkNotes.push('Strok seçilmedi veya geçersiz.');
  }
  if (!bore || !stroke) {
    return { codes: [], checkNotes };
  }

  const equivalenceGroup = getEquivalentGroups().find(
    (group) => group.id === PNEUMATIC_EQUIVALENCE_GROUP_ID
  );
  if (!equivalenceGroup) {
    return { codes: [], checkNotes: ['Pnömatik silindir grubu bulunamadı.'] };
  }

  if (options.selections.cushioning_type === 'with') {
    checkNotes.push(
      'Yastıklama seçildi; her marka için katalogdaki sönümleme kodu kullanıldı (seriye göre değişebilir).'
    );
  }
  if (options.selections.sensor_option === 'with') {
    checkNotes.push('Sensör seçildi; her marka için katalog kodu kullanıldı (seriye göre değişebilir).');
  }
  if (options.selections.rod_end_option && options.selections.rod_end_option !== 'none') {
    checkNotes.push('Mil ucu tipi seçildi; her marka için katalog kodu kullanıldı (seriye göre değişebilir).');
  }
  if (options.selections.extra_option && options.selections.extra_option !== 'none') {
    checkNotes.push('Ek seçenek eklendi; seri kataloğundan doğrulanmalıdır.');
  }

  const codes: GeneratedProductCode[] = [];

  for (const seriesId of equivalenceGroup.seriesIds) {
    const series = getProductSeriesById(seriesId);
    if (!series) {
      continue;
    }
    if (!seriesMatchesBrandFilter(series.brand, options.brandFilter)) {
      continue;
    }

    const { code, notes: buildNotes, catalogDerived } = buildPneumaticCreatorCode(
      series,
      bore,
      stroke,
      options.selections
    );
    const identification = identifyProduct(code, normalizeCode(code));
    const status =
      identification.outcome === 'full' ? 'generated_full' : ('generated_partial' as const);

    const entryNotes: string[] =
      status === 'generated_partial' && !catalogDerived
        ? ['Kod şablonu oluşturuldu; seri kurallarına göre doğrulama önerilir.']
        : [];
    entryNotes.push(...buildNotes);

    codes.push({
      brand: series.brand,
      series: series.series,
      seriesId: series.id,
      code,
      status,
      notes: entryNotes,
    });
  }

  return { codes, checkNotes };
}

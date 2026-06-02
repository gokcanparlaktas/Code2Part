import { getPneumaticCylinderCodeTemplate } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderSuggestedCode';
import { resolveSeriesCushioningToken } from '@/domain/codeCreator/pneumaticCreatorCatalogOptions';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getEquivalentGroups, getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { seriesMatchesBrandFilter } from '@/domain/codeCreator/getCodeCreatorSchema';
import type {
  CodeCreatorBrandKey,
  CodeCreatorSelections,
  GeneratedProductCode,
} from '@/types/productCodeCreator';

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

  const variant = selections.variant_suffix;
  if (variant && variant !== 'none') {
    suffixParts.push(variant);
  }

  if (suffixParts.length === 0) {
    return { code: baseCode, notes };
  }

  return { code: `${baseCode}-${suffixParts.join('-')}`, notes };
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
  if (options.selections.variant_suffix && options.selections.variant_suffix !== 'none') {
    checkNotes.push('Mil ucu / seçenek kodu eklendi; seri kataloğundan doğrulanmalıdır.');
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

    const template = getPneumaticCylinderCodeTemplate(series);
    const baseCode = applyTemplate(template, bore, stroke, series.codePrefix);
    const { code, notes: suffixNotes } = appendSuffixTokens(
      baseCode,
      series.id,
      options.selections
    );
    const identification = identifyProduct(code, normalizeCode(code));
    const status =
      identification.outcome === 'full' ? 'generated_full' : ('generated_partial' as const);

    const entryNotes: string[] =
      status === 'generated_partial'
        ? ['Kod şablonu oluşturuldu; seri kurallarına göre doğrulama önerilir.']
        : [];
    entryNotes.push(...suffixNotes);

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

import { pressuresEquivalentBar } from '@/domain/catalogData';
import type { AttributeComparison } from '@/types/compatibility';

import type { CanonicalField } from './hydraulicValveCanonicalTypes';

const CATALOG_CANDIDATE_REVIEW_TR = 'Katalog adayı — doğrulanmalı';
const CATALOG_PRESSURE_REVIEW_TR =
  'Katalog adayı — uygulama koşullarına göre doğrulanmalı';

/** Conservative relative shortfall when candidate max flow is below source (original) requirement. */
export const FLOW_CANDIDATE_SHORTFALL_TOLERANCE = 0.1;

const FLOW_GENERAL_CATALOG_NOTE =
  'Nominal debi sürgü tipi ve çalışma koşullarına bağlıdır; katalog tablosu ile doğrulanmalıdır.';

function fieldDisplayValue(
  field: CanonicalField<number | null> | undefined,
  unit: string
): string | null {
  if (!field) {
    return null;
  }
  if (field.catalogEvidence?.displayCandidate?.trim()) {
    return field.catalogEvidence.displayCandidate.trim();
  }
  if (field.value != null) {
    return `${field.value} ${unit}`;
  }
  return null;
}

function fieldNumericBar(field: CanonicalField<number | null> | undefined): number | null {
  if (!field) {
    return null;
  }
  if (field.catalogEvidence?.numericValueBar != null) {
    return field.catalogEvidence.numericValueBar;
  }
  if (field.value != null) {
    return field.value;
  }
  return null;
}

function fieldNumericLpm(field: CanonicalField<number | null> | undefined): number | null {
  if (!field) {
    return null;
  }
  if (field.catalogEvidence?.numericValueLpm != null) {
    return field.catalogEvidence.numericValueLpm;
  }
  if (field.value != null) {
    return field.value;
  }
  return null;
}

function flowContextNote(
  sourceField?: CanonicalField<number | null>,
  targetField?: CanonicalField<number | null>
): string {
  const sourceNotes = sourceField?.catalogEvidence?.technicalNotes ?? '';
  const targetNotes = targetField?.catalogEvidence?.technicalNotes ?? '';
  const combined = `${sourceNotes} ${targetNotes}`;
  if (
    /spool|operating conditions/i.test(combined) ||
    sourceField?.catalogEvidence?.needsReview ||
    targetField?.catalogEvidence?.needsReview
  ) {
    return FLOW_GENERAL_CATALOG_NOTE;
  }
  return 'Nominal debi çalışma koşullarına bağlı olabilir; katalog değeri ile doğrulanmalıdır.';
}

export function compareCatalogPressureFields(options: {
  sourceField?: CanonicalField<number | null>;
  targetField?: CanonicalField<number | null>;
  label: string;
}): { comparison: AttributeComparison; sentence: string | null; checkReasonTr?: string } {
  const label = options.label;
  const sourceDisplay = fieldDisplayValue(options.sourceField, 'bar') ?? 'Katalogda yok';
  const targetDisplay = fieldDisplayValue(options.targetField, 'bar') ?? 'Katalogda yok';
  const sourceBar = fieldNumericBar(options.sourceField);
  const targetBar = fieldNumericBar(options.targetField);
  const reviewRequired =
    Boolean(options.sourceField?.catalogEvidence?.needsReview) ||
    Boolean(options.targetField?.catalogEvidence?.needsReview);

  if (sourceBar == null && targetBar == null) {
    return {
      comparison: { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' },
      sentence: `${label} katalogdan doğrulanmalıdır.`,
      checkReasonTr: `${label} için katalog adayı değer bulunamadı.`,
    };
  }

  if (sourceBar == null || targetBar == null) {
    return {
      comparison: { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' },
      sentence: `${label}: bilinen katalog adayı değerler karşılaştırılmalıdır.`,
      checkReasonTr: `${label}: bir tarafta katalog adayı değer var (${sourceBar != null ? sourceDisplay : targetDisplay}); diğer taraf doğrulanmalıdır. ${CATALOG_CANDIDATE_REVIEW_TR}.`,
    };
  }

  if (pressuresEquivalentBar(sourceBar, targetBar)) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: `${label} aynı basınç sınıfı: ${sourceDisplay} / ${targetDisplay}.`,
      checkReasonTr: undefined,
    };
  }

  return {
    comparison: { label, sourceDisplay, targetDisplay, status: 'different' },
    sentence: `${label} farklı: ${sourceDisplay} / ${targetDisplay}`,
    checkReasonTr: `${label} katalog adayı değerleri farklı görünüyor; üretici kataloğu ile doğrulanmalıdır.`,
  };
}

/**
 * Directional flow compare: source = original product, target = equivalent candidate.
 * Higher candidate flow is not treated as incompatible.
 */
export function compareCatalogFlowFields(options: {
  sourceField?: CanonicalField<number | null>;
  targetField?: CanonicalField<number | null>;
  label: string;
  shortfallTolerance?: number;
}): { comparison: AttributeComparison; sentence: string | null; checkReasonTr?: string } {
  const label = options.label;
  const sourceDisplay = fieldDisplayValue(options.sourceField, 'L/dk') ?? 'Katalogda yok';
  const targetDisplay = fieldDisplayValue(options.targetField, 'L/dk') ?? 'Katalogda yok';
  const requiredLpm = fieldNumericLpm(options.sourceField);
  const candidateLpm = fieldNumericLpm(options.targetField);
  const contextNote = flowContextNote(options.sourceField, options.targetField);
  const tolerance = options.shortfallTolerance ?? FLOW_CANDIDATE_SHORTFALL_TOLERANCE;
  const reviewRequired =
    Boolean(options.sourceField?.catalogEvidence?.needsReview) ||
    Boolean(options.targetField?.catalogEvidence?.needsReview);

  if (requiredLpm == null && candidateLpm == null) {
    return {
      comparison: { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' },
      sentence: `${label} katalogdan doğrulanmalıdır.`,
      checkReasonTr: `${label} için katalog adayı değer bulunamadı.`,
    };
  }

  if (requiredLpm == null || candidateLpm == null) {
    return {
      comparison: { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' },
      sentence: `${label}: bilinen katalog adayı değerler karşılaştırılmalıdır.`,
      checkReasonTr: `${label}: ${requiredLpm != null ? sourceDisplay : targetDisplay} katalog adayı olarak biliniyor. ${contextNote} ${CATALOG_CANDIDATE_REVIEW_TR}.`,
    };
  }

  if (requiredLpm === candidateLpm) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: `${label} aynı nominal değer: ${sourceDisplay} / ${targetDisplay}. ${contextNote}`,
    };
  }

  if (candidateLpm >= requiredLpm) {
    return {
      comparison: {
        label,
        sourceDisplay,
        targetDisplay,
        status: 'compatible',
      },
      sentence: `${label}: aday debi kapasitesi kaynak ürünü karşılıyor görünüyor (${sourceDisplay} → ${targetDisplay}). ${contextNote}`,
      checkReasonTr: undefined,
    };
  }

  const shortfall = (requiredLpm - candidateLpm) / requiredLpm;

  if (shortfall <= tolerance) {
    return {
      comparison: { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' },
      sentence: `${label}: aday debi biraz daha düşük olabilir (${sourceDisplay} → ${targetDisplay}). ${contextNote}`,
      checkReasonTr: `Debi değeri daha düşük olabilir; uygulama koşullarına göre kontrol edilmelidir. ${contextNote} ${CATALOG_CANDIDATE_REVIEW_TR}.`,
    };
  }

  return {
    comparison: { label, sourceDisplay, targetDisplay, status: 'unknownOrCheck' },
    sentence: `${label}: aday nominal debi kaynak ürünün altında görünüyor (${sourceDisplay} → ${targetDisplay}). ${contextNote}`,
    checkReasonTr: `Aday debi (${targetDisplay}) kaynak ürün debisinin (${sourceDisplay}) altında görünüyor; yetersiz kalma riski için uygulama koşullarına göre kontrol edilmelidir. ${contextNote} ${CATALOG_CANDIDATE_REVIEW_TR}.`,
  };
}

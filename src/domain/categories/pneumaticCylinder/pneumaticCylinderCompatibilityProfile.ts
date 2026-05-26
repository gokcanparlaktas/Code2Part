import type { EquivalentCandidate } from '@/types/compatibility';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';

type AttributeDef = ProductCompatibilityProfile['attributes'][string];

function pickAttr(
  attrs: TechnicalAttribute[],
  key: string
): (TechnicalAttribute & { normalizedValue?: string | number | null; requiresCatalogCheck?: boolean }) | null {
  const match = attrs.find((a) => a.key === key) as any;
  return match ?? null;
}

function fromTechAttr(
  tech: ReturnType<typeof pickAttr>,
  fallback: Partial<AttributeDef> & Pick<AttributeDef, 'label' | 'importance' | 'compareMode'>
): AttributeDef {
  return {
    label: fallback.label,
    value: tech?.value ?? null,
    unit: tech?.unit,
    importance: fallback.importance,
    compareMode: fallback.compareMode,
    evidence: tech?.evidence ?? 'unknown',
    confidence: tech?.confidence ?? 'unknown',
    requiresCatalogCheck: Boolean(tech?.requiresCatalogCheck),
    notes: tech?.note ? [tech.note] : undefined,
  };
}

function fromCandidateString(options: {
  label: string;
  value: string | null;
  importance: AttributeDef['importance'];
  compareMode: AttributeDef['compareMode'];
}): AttributeDef {
  return {
    label: options.label,
    value: options.value,
    importance: options.importance,
    compareMode: options.compareMode,
    evidence: options.value ? 'series_table' : 'unknown',
    confidence: options.value ? 'medium' : 'unknown',
    requiresCatalogCheck: options.value ? true : undefined,
  };
}

export function buildPneumaticCylinderCompatibilityProfile(options: {
  identification: ProductIdentification | null;
  candidate?: EquivalentCandidate;
}): ProductCompatibilityProfile {
  const attrs = options.identification ? getTechnicalAttributes(options.identification) : [];

  const standardFamily =
    options.identification?.standardFamily.value ??
    options.candidate?.standardFamily ??
    null;

  const bore = pickAttr(attrs, 'bore');
  const stroke = pickAttr(attrs, 'stroke');
  const cushioning = pickAttr(attrs, 'cushioning_token');

  return {
    productCategory: PNEUMATIC_CYLINDER_CATEGORY,
    brand:
      options.identification?.brand.value ??
      options.candidate?.brand ??
      undefined,
    series:
      options.identification?.series.value ??
      options.candidate?.series ??
      undefined,
    attributes: {
      productCategory: fromCandidateString({
        label: 'Ürün kategorisi',
        value: options.candidate?.productCategory ?? options.identification?.productCategory.value ?? null,
        importance: 'critical',
        compareMode: 'exact',
      }),
      standardFamily: {
        label: 'Standart ailesi',
        value: standardFamily,
        importance: 'critical',
        compareMode: 'same_or_check',
        evidence: standardFamily ? 'series_table' : 'unknown',
        confidence: standardFamily ? 'medium' : 'unknown',
        requiresCatalogCheck: standardFamily ? true : undefined,
      },
      bore: fromTechAttr(bore, {
        label: 'Çap (bore)',
        importance: 'critical',
        compareMode: 'numeric',
      }),
      stroke: fromTechAttr(stroke, {
        label: 'Strok',
        importance: 'critical',
        compareMode: 'numeric',
      }),
      cushioning: fromTechAttr(cushioning, {
        label: 'Sönümleme tipi',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      magneticPiston: {
        label: 'Manyetik piston',
        value: null,
        importance: 'important',
        compareMode: 'presence',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
      },
      mountingInterface: {
        label: 'Montaj / arayüz',
        value: null,
        importance: 'important',
        compareMode: 'catalog_check',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
      },
      portThread: {
        label: 'Port / diş ölçüsü',
        value: null,
        importance: 'important',
        compareMode: 'catalog_check',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
      },
      sensorCompatibility: {
        label: 'Sensör uyumu',
        value: null,
        importance: 'optional',
        compareMode: 'catalog_check',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
      },
      rodEnd: {
        label: 'Mil ucu / diş',
        value: null,
        importance: 'optional',
        compareMode: 'catalog_check',
        evidence: 'unknown',
        confidence: 'unknown',
        requiresCatalogCheck: true,
      },
      manufacturerSeriesDifference: {
        label: 'Üretici / seri farkı',
        value: options.identification?.brand.value
          ? true
          : null,
        importance: 'optional',
        compareMode: 'catalog_check',
        evidence: options.identification?.brand.value ? 'series_table' : 'unknown',
        confidence: options.identification?.brand.value ? 'low' : 'unknown',
        requiresCatalogCheck: true,
      },
    },
  };
}


import type { EquivalentCandidate } from '@/types/compatibility';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';
import { normalizeCompatibilityProfile } from '@/domain/normalization/normalizeCompatibilityProfile';
import {
  normalizeCushioningAttribute,
  normalizeStandardFamilyAttribute,
} from '@/domain/normalization/normalizeTechnicalAttribute';

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
    rawValue: tech?.value ?? null,
    rawToken: typeof tech?.value === 'string' ? tech.value : undefined,
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
    rawValue: options.value,
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

  const brand =
    options.identification?.brand.value ??
    options.candidate?.brand ??
    undefined;

  const standardFamilyRaw =
    options.identification?.standardFamily.value ??
    options.candidate?.standardFamily ??
    null;

  const bore = pickAttr(attrs, 'bore');
  const stroke = pickAttr(attrs, 'stroke');
  const cushioning = pickAttr(attrs, 'cushioning_token');

  const profile: ProductCompatibilityProfile = {
    productCategory: PNEUMATIC_CYLINDER_CATEGORY,
    brand,
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
      standardFamily: normalizeStandardFamilyAttribute({
        rawValue: standardFamilyRaw,
        manufacturer: brand,
        evidence: standardFamilyRaw ? 'series_table' : 'unknown',
        confidence: standardFamilyRaw ? 'medium' : 'unknown',
      }),
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
      cushioning: cushioning?.value
        ? normalizeCushioningAttribute({
            rawToken: String(cushioning.value),
            manufacturer: brand,
            evidence: cushioning.evidence,
            confidence: cushioning.confidence,
          })
        : normalizeCushioningAttribute({
            rawToken: null,
            manufacturer: brand,
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

  return normalizeCompatibilityProfile(profile);
}

import type { EquivalentCandidate } from '@/types/compatibility';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';
import { normalizeCompatibilityProfile } from '@/domain/normalization/normalizeCompatibilityProfile';

type AttributeDef = ProductCompatibilityProfile['attributes'][string];

function pickAttr(
  attrs: TechnicalAttribute[],
  key: string
): (TechnicalAttribute & { normalizedValue?: string | number | null; requiresCatalogCheck?: boolean }) | null {
  const match = attrs.find((a) => a.key === key) as any;
  return match ?? null;
}

function attrValueString(
  attrs: TechnicalAttribute[],
  key: string
): string | null {
  const a = pickAttr(attrs, key);
  if (!a || a.value === null) {
    return null;
  }
  if (typeof a.value === 'string') {
    return a.value;
  }
  return String(a.value);
}

function fromTechAttr(
  tech: ReturnType<typeof pickAttr>,
  fallback: Partial<AttributeDef> & Pick<AttributeDef, 'label' | 'importance' | 'compareMode'>
): AttributeDef {
  const normalizedValue = (tech as any)?.normalizedValue;
  const sourceToken = (tech as any)?.sourceToken as string | undefined;
  return {
    label: fallback.label,
    value: normalizedValue !== undefined && normalizedValue !== null ? normalizedValue : tech?.value ?? null,
    rawValue: tech?.value ?? null,
    rawToken: sourceToken,
    unit: tech?.unit,
    importance: fallback.importance,
    compareMode: fallback.compareMode,
    evidence: tech?.evidence ?? 'unknown',
    confidence: tech?.confidence ?? 'unknown',
    requiresCatalogCheck: Boolean((tech as any)?.requiresCatalogCheck),
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

export function buildHydraulicValveCompatibilityProfile(options: {
  identification: ProductIdentification | null;
  candidate?: EquivalentCandidate;
}): ProductCompatibilityProfile {
  const attrs = options.identification ? getTechnicalAttributes(options.identification) : [];

  const cetop =
    pickAttr(attrs, 'cetop_ng') ??
    null;

  const voltage = pickAttr(attrs, 'voltage');
  const functionToken = pickAttr(attrs, 'function_token');
  const spoolSymbol = pickAttr(attrs, 'spool_symbol');
  const connector = pickAttr(attrs, 'connector');
  const connectorCode = pickAttr(attrs, 'connector_token');
  const manualOverride = pickAttr(attrs, 'manual_override');
  const maxPressure = pickAttr(attrs, 'max_pressure_abp');
  const maxFlow = pickAttr(attrs, 'max_flow');
  const designSeries = pickAttr(attrs, 'component_series') ?? pickAttr(attrs, 'revision');

  const positions = pickAttr(attrs, 'number_of_positions');
  const centering = pickAttr(attrs, 'centering');
  const centerCondition = pickAttr(attrs, 'center_condition');
  const normallyState = pickAttr(attrs, 'normally_state');

  const valveWays = pickAttr(attrs, 'valve_ways');
  const sealMaterial = pickAttr(attrs, 'seal_material');

  const voltageCode = pickAttr(attrs, 'coil_voltage_code');

  const productCategoryValue =
    options.candidate?.productCategory ??
    options.identification?.productCategory.value ??
    null;

  const profile: ProductCompatibilityProfile = {
    productCategory: HYDRAULIC_VALVE_CATEGORY,
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
        value: productCategoryValue,
        importance: 'critical',
        compareMode: 'exact',
      }),
      cetopNg: fromTechAttr(cetop, {
        label: 'CETOP / NG ölçüsü',
        importance: 'critical',
        compareMode: 'same_or_check',
      }),
      valveWays: fromTechAttr(valveWays, {
        label: 'Yol sayısı',
        importance: 'critical',
        compareMode: 'numeric',
      }),
      positions: fromTechAttr(positions, {
        label: 'Konum sayısı',
        importance: 'critical',
        compareMode: 'numeric',
      }),
      centering: fromTechAttr(centering, {
        label: 'Merkezleme',
        importance: 'critical',
        compareMode: 'same_or_check',
      }),
      centerCondition: fromTechAttr(centerCondition, {
        label: 'Merkez tipi',
        importance: 'critical',
        compareMode: 'same_or_check',
      }),
      normallyState: fromTechAttr(normallyState, {
        label: 'Normal durum',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      spoolSymbol: fromTechAttr(spoolSymbol, {
        label: 'Sürgü sembolü',
        importance: 'important',
        compareMode: 'catalog_check',
      }),
      spoolFunctionCode: fromTechAttr(functionToken, {
        label: 'Sürgü / fonksiyon kodu',
        importance: 'important',
        compareMode: 'catalog_check',
      }),
      voltage: fromTechAttr(voltage, {
        label: 'Bobin voltajı',
        importance: 'critical',
        compareMode: 'same_or_check',
      }),
      voltageCode: fromTechAttr(voltageCode, {
        label: 'Bobin kodu',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      connector: fromTechAttr(connector, {
        label: 'Konnektör tipi',
        importance: 'important',
        compareMode: 'catalog_check',
      }),
      connectorCode: fromTechAttr(connectorCode, {
        label: 'Konnektör kodu',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      manualOverride: fromTechAttr(manualOverride, {
        label: 'Manuel kumanda',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      maxPressureBar: fromTechAttr(maxPressure, {
        label: 'Maks. basınç',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      maxFlowLpm: fromTechAttr(maxFlow, {
        label: 'Maks. debi',
        importance: 'important',
        compareMode: 'same_or_check',
      }),
      sealMaterial: fromTechAttr(sealMaterial, {
        label: 'Keçe / sızdırmazlık malzemesi',
        importance: 'optional',
        compareMode: 'catalog_check',
      }),
      designSeries: fromTechAttr(designSeries, {
        label: 'Tasarım serisi',
        importance: 'optional',
        compareMode: 'catalog_check',
      }),
      // Some vendors expose explicit codes; keep them as optional.
      connectorTokenRaw: fromCandidateString({
        label: 'Konnektör token',
        value: attrValueString(attrs, 'connector_token') ?? null,
        importance: 'optional',
        compareMode: 'ignore',
      }),
    },
  };

  return normalizeCompatibilityProfile(profile);
}


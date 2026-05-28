import { HYDRAULIC_VALVE_CATEGORY } from "@/types/category";
import type { EquivalentCandidate } from "@/types/compatibility";
import type { ProductIdentification } from "@/types/product";
import type { TechnicalAttribute } from "@/types/technicalAttribute";

import { getTechnicalAttributes } from "@/domain/attributes/getTechnicalAttributes";
import { canonicalResolvedToProfileAttribute } from "@/domain/canonical/canonicalToCompatibilityAttribute";
import {
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from "@/domain/canonical/resolveCanonicalAttribute";
import type { ProductCompatibilityProfile } from "@/domain/compatibilityProfiles/compatibilityProfile";
import { normalizeCompatibilityProfile } from "@/domain/normalization/normalizeCompatibilityProfile";

type AttributeDef = ProductCompatibilityProfile["attributes"][string];

function pickAttr(
  attrs: TechnicalAttribute[],
  key: string,
):
  | (TechnicalAttribute & {
      normalizedValue?: string | number | null;
      requiresCatalogCheck?: boolean;
    })
  | null {
  const match = attrs.find((a) => a.key === key) as any;
  return match ?? null;
}

function pickFirstAttr(
  attrs: TechnicalAttribute[],
  keys: string[],
): ReturnType<typeof pickAttr> {
  for (const key of keys) {
    const hit = pickAttr(attrs, key);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function buildCoilVoltageProfileAttribute(
  attrs: TechnicalAttribute[],
  identification: ProductIdentification | null,
): AttributeDef {
  const coilRating = pickFirstAttr(attrs, ["coil_rating", "coil_voltage_code"]);
  const legacyVoltage = pickAttr(attrs, "voltage");

  if (!coilRating?.value) {
    return fromTechAttr(legacyVoltage, {
      label: "Bobin voltajı",
      importance: "critical",
      compareMode: "same_or_check",
    });
  }

  const rawToken = String(coilRating.value);
  const resolved = resolveCanonicalAttribute({
    category: HYDRAULIC_VALVE_CATEGORY,
    manufacturer: identification?.brand.value ?? undefined,
    series: identification?.series.value ?? undefined,
    attributeKey: "coil_rating",
    rawToken,
    evidence: coilRating.evidence,
    confidence: coilRating.confidence,
  });

  if (isUnknownCanonical(resolved) && legacyVoltage) {
    return fromTechAttr(legacyVoltage, {
      label: "Bobin voltajı",
      importance: "critical",
      compareMode: "same_or_check",
    });
  }

  return canonicalResolvedToProfileAttribute(resolved, {
    label: "Bobin voltajı",
    importance: "critical",
    compareMode: "same_or_check",
  });
}

function buildDesignSeriesProfileAttribute(options: {
  attrs: TechnicalAttribute[];
  identification: ProductIdentification | null;
}): AttributeDef {
  const design = pickFirstAttr(options.attrs, [
    "design_series",
    "component_series",
    "revision",
  ]);
  if (!design?.value) {
    return fromTechAttr(null, {
      label: "Tasarım serisi",
      importance: "optional",
      compareMode: "ignore",
    });
  }

  const rawToken = String(design.value);
  if ((options.identification?.brand.value ?? '').trim().toLowerCase() === 'atos' && rawToken.trim().toUpperCase() === 'X') {
    // Atos X is not a design series; treated as connector option elsewhere.
    return fromTechAttr(null, {
      label: "Tasarım serisi",
      importance: "optional",
      compareMode: "ignore",
    });
  }
  const resolved = resolveCanonicalAttribute({
    category: HYDRAULIC_VALVE_CATEGORY,
    manufacturer: options.identification?.brand.value ?? undefined,
    series: options.identification?.series.value ?? undefined,
    attributeKey: "design_series",
    rawToken,
    evidence: design.evidence,
    confidence: design.confidence,
  });

  if (isUnknownCanonical(resolved)) {
    // Avoid leaking raw token into primary UI; keep optional and check-required.
    return canonicalResolvedToProfileAttribute(resolved, {
      label: "Tasarım serisi",
      importance: "optional",
      compareMode: "ignore",
    });
  }

  return canonicalResolvedToProfileAttribute(resolved, {
    label: "Tasarım serisi",
    importance: "optional",
    compareMode: "ignore",
  });
}

function attrValueString(
  attrs: TechnicalAttribute[],
  key: string,
): string | null {
  const a = pickAttr(attrs, key);
  if (!a || a.value === null) {
    return null;
  }
  if (typeof a.value === "string") {
    return a.value;
  }
  return String(a.value);
}

function fromTechAttr(
  tech: ReturnType<typeof pickAttr>,
  fallback: Partial<AttributeDef> &
    Pick<AttributeDef, "label" | "importance" | "compareMode">,
): AttributeDef {
  const normalizedValue = (tech as any)?.normalizedValue;
  const sourceToken = (tech as any)?.sourceToken as string | undefined;
  return {
    label: fallback.label,
    value:
      normalizedValue !== undefined && normalizedValue !== null
        ? normalizedValue
        : (tech?.value ?? null),
    rawValue: tech?.value ?? null,
    rawToken: sourceToken,
    unit: tech?.unit,
    importance: fallback.importance,
    compareMode: fallback.compareMode,
    evidence: tech?.evidence ?? "unknown",
    confidence: tech?.confidence ?? "unknown",
    requiresCatalogCheck: Boolean((tech as any)?.requiresCatalogCheck),
    notes: tech?.note ? [tech.note] : undefined,
  };
}

function fromCandidateString(options: {
  label: string;
  value: string | null;
  importance: AttributeDef["importance"];
  compareMode: AttributeDef["compareMode"];
}): AttributeDef {
  return {
    label: options.label,
    value: options.value,
    importance: options.importance,
    compareMode: options.compareMode,
    evidence: options.value ? "series_table" : "unknown",
    confidence: options.value ? "medium" : "unknown",
    requiresCatalogCheck: options.value ? true : undefined,
  };
}

export function buildHydraulicValveCompatibilityProfile(options: {
  identification: ProductIdentification | null;
  candidate?: EquivalentCandidate;
}): ProductCompatibilityProfile {
  const attrs = options.identification
    ? getTechnicalAttributes(options.identification)
    : [];

  const cetop = pickAttr(attrs, "cetop_ng") ?? null;

  const voltageCode = pickFirstAttr(attrs, ["coil_rating", "coil_voltage_code"]);
  const functionToken = pickFirstAttr(attrs, ["function_code", "function_token"]);
  const spoolSymbol = pickAttr(attrs, "spool_symbol");
  const connector = pickAttr(attrs, "connector");
  const connectorCode = pickFirstAttr(attrs, [
    "connector_type",
    "connector_token",
    "connector_option",
  ]);
  const manualOverride = pickAttr(attrs, "manual_override");
  const maxPressure = pickAttr(attrs, "max_pressure_abp");
  const maxFlow = pickAttr(attrs, "max_flow");
  const designSeries =
    pickFirstAttr(attrs, ["design_series", "component_series", "revision"]) ??
    null;

  const positions = pickAttr(attrs, "number_of_positions");
  const centering = pickAttr(attrs, "centering");
  const centerCondition = pickAttr(attrs, "center_condition");
  const normallyState = pickAttr(attrs, "normally_state");

  const valveWays = pickAttr(attrs, "valve_ways");
  const sealMaterial = pickAttr(attrs, "seal_material");

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
        label: "Ürün kategorisi",
        value: productCategoryValue,
        importance: "critical",
        compareMode: "exact",
      }),
      cetopNg: fromTechAttr(cetop, {
        label: "CETOP / NG ölçüsü",
        importance: "critical",
        compareMode: "same_or_check",
      }),
      valveWays: fromTechAttr(valveWays, {
        label: "Yol sayısı",
        importance: "critical",
        compareMode: "numeric",
      }),
      positions: fromTechAttr(positions, {
        label: "Konum sayısı",
        importance: "critical",
        compareMode: "numeric",
      }),
      centering: fromTechAttr(centering, {
        label: "Merkezleme",
        importance: "critical",
        compareMode: "same_or_check",
      }),
      centerCondition: fromTechAttr(centerCondition, {
        label: "Merkez tipi",
        importance: "critical",
        compareMode: "same_or_check",
      }),
      normallyState: fromTechAttr(normallyState, {
        label: "Normal durum",
        importance: "important",
        compareMode: "same_or_check",
      }),
      spoolSymbol: fromTechAttr(spoolSymbol, {
        label: "Sürgü sembolü",
        importance: "important",
        compareMode: "catalog_check",
      }),
      spoolFunctionCode: fromTechAttr(functionToken, {
        label: "Sürgü / fonksiyon kodu",
        importance: "important",
        compareMode: "catalog_check",
      }),
      voltage: buildCoilVoltageProfileAttribute(attrs, options.identification),
      voltageCode: fromTechAttr(voltageCode, {
        label: "Bobin kodu",
        importance: "important",
        compareMode: "same_or_check",
      }),
      connector: fromTechAttr(connector, {
        label: "Konnektör tipi",
        importance: "important",
        compareMode: "catalog_check",
      }),
      connectorCode: fromTechAttr(connectorCode, {
        label: "Konnektör kodu",
        importance: "important",
        compareMode: "same_or_check",
      }),
      manualOverride: fromTechAttr(manualOverride, {
        label: "Manuel kumanda",
        importance: "important",
        compareMode: "same_or_check",
      }),
      maxPressureBar: fromTechAttr(maxPressure, {
        label: "Maks. basınç",
        importance: "important",
        compareMode: "same_or_check",
      }),
      maxFlowLpm: fromTechAttr(maxFlow, {
        label: "Maks. debi",
        importance: "important",
        compareMode: "same_or_check",
      }),
      sealMaterial: fromTechAttr(sealMaterial, {
        label: "Keçe / sızdırmazlık malzemesi",
        importance: "optional",
        compareMode: "catalog_check",
      }),
      designSeries: buildDesignSeriesProfileAttribute({
        attrs,
        identification: options.identification ?? null,
      }),
      // Some vendors expose explicit codes; keep them as optional.
      connectorTokenRaw: fromCandidateString({
        label: "Konnektör token",
        value: attrValueString(attrs, "connector_token") ?? null,
        importance: "optional",
        compareMode: "ignore",
      }),
    },
  };

  return normalizeCompatibilityProfile(profile);
}

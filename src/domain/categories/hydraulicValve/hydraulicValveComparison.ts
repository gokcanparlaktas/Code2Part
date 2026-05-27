import type {
    AttributeComparison,
    CheckItem,
    CompatibilityResult,
    EquivalenceSummary,
    EquivalentCandidate,
} from "@/types/compatibility";
import type {
    ProductIdentification,
    TechnicalAttribute,
} from "@/types/product";
import { formatAttributeValue } from "@/utils/formatConfidence";

import { getTechnicalAttributes } from "@/domain/attributes/getTechnicalAttributes";
import {
    buildCandidateFallbackCanonicalProfile,
    buildHydraulicValveCanonicalProfile,
} from "@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile";
import {
    canonicalComparisonToCompatibilityResult,
    compareHydraulicValveCanonicalProfiles,
} from "@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles";
import { compareValveFunctionBehavior } from "@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior";
import { compareCompatibilityProfilesDetailed } from "@/domain/compatibilityProfiles/compareCompatibilityProfiles";
import {
    getHydraulicValveCheckItems,
    HYDRAULIC_VALVE_WARNINGS,
} from "./hydraulicValveCheckItems";
import { buildHydraulicValveCompatibilityProfile } from "./hydraulicValveCompatibilityProfile";

function displayAttribute(attr: TechnicalAttribute<string | number>): string {
  return formatAttributeValue(attr.value, attr.unit);
}

function compareAttribute(
  label: string,
  source: TechnicalAttribute<string | number>,
  target: TechnicalAttribute<string | number> | string,
): AttributeComparison {
  const targetAttr: TechnicalAttribute<string | number> =
    typeof target === "string"
      ? { value: target, evidence: "series_table", requiresCheck: false }
      : target;

  const sourceDisplay = displayAttribute(source);
  const targetDisplay = displayAttribute(targetAttr);

  if (source.requiresCheck || targetAttr.requiresCheck) {
    return { label, sourceDisplay, targetDisplay, status: "unknownOrCheck" };
  }

  if (
    source.evidence === "unknown" ||
    targetAttr.evidence === "unknown" ||
    source.value === null ||
    targetAttr.value === null
  ) {
    return { label, sourceDisplay, targetDisplay, status: "unknownOrCheck" };
  }

  if (source.evidence === "inferred" || targetAttr.evidence === "inferred") {
    return { label, sourceDisplay, targetDisplay, status: "unknownOrCheck" };
  }

  if (String(source.value) === String(targetAttr.value)) {
    return { label, sourceDisplay, targetDisplay, status: "compatible" };
  }

  return { label, sourceDisplay, targetDisplay, status: "different" };
}

type AttributeWithNormalized = ReturnType<
  typeof getTechnicalAttributes
>[number] & {
  normalizedValue?: string | number | null;
};

function getAttrValue(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  key: string,
): string | null {
  const match = attributes.find((a) => a.key === key);
  if (!match || match.value === null) {
    return null;
  }
  const unit = match.unit ? ` ${match.unit}` : "";
  return `${match.value}${unit}`;
}

/** Prefer normalized machine values (e.g. spring_centered) when present. */
function getComparableAttrValue(
  attributes: ReturnType<typeof getTechnicalAttributes>,
  key: string,
): string | null {
  const match = attributes.find((a) => a.key === key) as
    | AttributeWithNormalized
    | undefined;
  if (!match) {
    return null;
  }
  if (match.normalizedValue !== undefined && match.normalizedValue !== null) {
    return String(match.normalizedValue);
  }
  if (match.value === null) {
    return null;
  }
  const unit = match.unit ? ` ${match.unit}` : "";
  return `${match.value}${unit}`;
}

function getFunctionTokenForComparison(
  attributes: ReturnType<typeof getTechnicalAttributes>,
): string | null {
  return (
    getAttrValue(attributes, "function_token") ??
    getAttrValue(attributes, "spool_function_code") ??
    getAttrValue(attributes, "spool_symbol")
  );
}

const UNRESOLVED_COIL_VOLTAGE_CODES = new Set(["H7"]);

function compareCoilVoltageCode(options: {
  sourceValue: string | null;
  targetValue: string | null;
}): AttributeComparison {
  const sourceDisplay = options.sourceValue ?? "Doğrulanamadı";
  const targetDisplay = options.targetValue ?? "Doğrulanamadı";

  if (!options.sourceValue || !options.targetValue) {
    return {
      label: "Bobin kodu",
      sourceDisplay,
      targetDisplay,
      status: "unknownOrCheck",
    };
  }

  if (
    UNRESOLVED_COIL_VOLTAGE_CODES.has(options.sourceValue) ||
    UNRESOLVED_COIL_VOLTAGE_CODES.has(options.targetValue)
  ) {
    return {
      label: "Bobin kodu",
      sourceDisplay,
      targetDisplay,
      status: "unknownOrCheck",
    };
  }

  if (options.sourceValue === options.targetValue) {
    return {
      label: "Bobin kodu",
      sourceDisplay,
      targetDisplay,
      status: "compatible",
    };
  }

  return {
    label: "Bobin kodu",
    sourceDisplay,
    targetDisplay,
    status: "different",
  };
}

function compareOptionalString(options: {
  label: string;
  sourceValue: string | null;
  targetValue: string | null;
  missingMessageTr: string;
}): AttributeComparison {
  const sourceDisplay = options.sourceValue ?? "Doğrulanamadı";
  const targetDisplay = options.targetValue ?? "Doğrulanamadı";

  if (!options.sourceValue || !options.targetValue) {
    return {
      label: options.label,
      sourceDisplay,
      targetDisplay,
      status: "unknownOrCheck",
    };
  }

  if (options.sourceValue === options.targetValue) {
    return {
      label: options.label,
      sourceDisplay,
      targetDisplay,
      status: "compatible",
    };
  }

  return {
    label: options.label,
    sourceDisplay,
    targetDisplay,
    status: "different",
  };
}

function comparisonToCheckItem(
  comparison: AttributeComparison,
): CheckItem | null {
  if (comparison.status !== "unknownOrCheck") {
    return null;
  }

  return {
    field: comparison.label,
    sourceValue: comparison.sourceDisplay,
    targetValue: comparison.targetDisplay,
    reasonTr: `${comparison.label} için yeterli kesin bilgi yok. Katalog veya şema ile doğrulanmalıdır.`,
    severity: comparison.label.includes("CETOP") ? "high" : "medium",
  };
}

function lookupEquivalenceSummary(
  compatibleCount: number,
  differentCount: number,
): EquivalenceSummary {
  if (differentCount > 0) {
    return {
      matchLevelTr: "Fonksiyonel alternatif",
      summaryTr:
        "CETOP/NG veya kategori farkı var. Hidrolik valf muadili için detaylı mühendislik kontrolü gerekir.",
      riskLevel: "high",
    };
  }

  if (compatibleCount >= 2) {
    return {
      matchLevelTr: "Mekanik muadil adayı",
      summaryTr:
        "Aynı CETOP/NG grubunda muadil olabilir. Sürgü, bobin ve konnektör sipariş öncesi doğrulanmalıdır.",
      riskLevel: "medium",
    };
  }

  return {
    matchLevelTr: "Fonksiyonel alternatif",
    summaryTr: "Sınırlı alan uyumu. Tüm teknik detaylar kontrol edilmelidir.",
    riskLevel: "high",
  };
}

function buildHydraulicValveProfileScoring(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
) {
  const target = candidate.targetIdentification;
  const sourceProfile = buildHydraulicValveCompatibilityProfile({
    identification: source,
  });
  const targetProfile = buildHydraulicValveCompatibilityProfile({
    identification: target,
    candidate,
  });
  return compareCompatibilityProfilesDetailed(sourceProfile, targetProfile)
    .scoredComparisons;
}

export function compareHydraulicValves(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const sourceAttrs = getTechnicalAttributes(source);
  const targetAttrs = target ? getTechnicalAttributes(target) : [];

  const useBehaviorProfiles =
    source.resolverCategoryKey === "hydraulic_valve" && sourceAttrs.length > 0;

  if (useBehaviorProfiles) {
    const sourceProfile = buildHydraulicValveCanonicalProfile({
      identification: source,
      attributes: sourceAttrs,
    });
    const targetProfile = target
      ? buildHydraulicValveCanonicalProfile({
          identification: target,
          attributes: targetAttrs,
        })
      : buildCandidateFallbackCanonicalProfile(candidate);

    const canonical = compareHydraulicValveCanonicalProfiles(
      sourceProfile,
      targetProfile,
    );

    return canonicalComparisonToCompatibilityResult({
      source,
      candidate,
      canonical,
    });
  }

  return compareHydraulicValvesFromAttributes(source, candidate);
}

/** Attribute-level comparison fallback when behavior profile path is unavailable. */
export function compareHydraulicValvesFromAttributes(
  source: ProductIdentification,
  candidate: EquivalentCandidate,
): CompatibilityResult {
  const target = candidate.targetIdentification;
  const sourceAttrs = getTechnicalAttributes(source);
  const targetAttrs = target ? getTechnicalAttributes(target) : [];

  const sourceProfile = buildHydraulicValveCompatibilityProfile({
    identification: source,
  });
  const targetProfile = buildHydraulicValveCompatibilityProfile({
    identification: target,
    candidate,
  });
  const profileComparison = compareCompatibilityProfilesDetailed(
    sourceProfile,
    targetProfile,
  );

  const sourceFunction = getFunctionTokenForComparison(sourceAttrs);
  const targetFunction = target
    ? getFunctionTokenForComparison(targetAttrs)
    : null;

  const functionMatch = compareValveFunctionBehavior({
    label: "Sürgü / fonksiyon kodu",
    source: {
      manufacturer: String(source.brand.value ?? ""),
      series: String(source.series.value ?? ""),
      token: sourceFunction,
    },
    target: {
      manufacturer: target ? String(target.brand.value ?? "") : candidate.brand,
      series: target ? String(target.series.value ?? "") : candidate.series,
      token: targetFunction,
    },
  });

  // Use profile comparisons as the base set, but override function/spool logic with the
  // manufacturer-aware comparison (keeps cautious messaging + existing tests).
  const comparisons: AttributeComparison[] = profileComparison.comparisons
    .filter((c) => c.label !== "Sürgü / fonksiyon kodu")
    .concat(functionMatch.comparison);

  const compatible = comparisons.filter((c) => c.status === "compatible");
  const different = comparisons.filter((c) => c.status === "different");

  const findComparison = (label: string) =>
    comparisons.find((c) => c.label === label);
  const spoolComparison = findComparison("Sürgü / fonksiyon kodu");
  const voltageComparison = findComparison("Bobin voltajı");
  const connectorComparison = findComparison("Konnektör kodu");

  const baseCheckItems = profileComparison.checkItems.filter(
    (item) =>
      !["Bobin voltajı", "Konnektör kodu", "Sürgü / fonksiyon kodu"].includes(
        item.field,
      ),
  );

  const checkItems: CheckItem[] = [
    ...getHydraulicValveCheckItems(source, candidate, {
      spool: spoolComparison
        ? {
            source: spoolComparison.sourceDisplay,
            target: spoolComparison.targetDisplay,
            status: spoolComparison.status,
            reasonTr:
              spoolComparison.status === "unknownOrCheck"
                ? functionMatch.statusMessageTr
                : undefined,
          }
        : undefined,
      voltage: voltageComparison
        ? {
            source: voltageComparison.sourceDisplay,
            target: voltageComparison.targetDisplay,
            status: voltageComparison.status,
          }
        : undefined,
      connector: connectorComparison
        ? {
            source: connectorComparison.sourceDisplay,
            target: connectorComparison.targetDisplay,
            status: connectorComparison.status,
          }
        : undefined,
    }),
    ...baseCheckItems,
  ];

  const warningSet = new Set<string>(HYDRAULIC_VALVE_WARNINGS);
  if (
    functionMatch.requiresCatalogCheck &&
    functionMatch.statusMessageTr &&
    functionMatch.comparison.status === "different"
  ) {
    warningSet.add(functionMatch.statusMessageTr);
  }

  const warnings = [...warningSet];
  if (!candidate.suggestedCode) {
    warnings.push(
      "Örnek muadil kodu gösterilemedi. Sürgü, voltaj ve konnektör bilgileri doğrulanmalıdır.",
    );
  }

  return {
    candidate,
    summary: lookupEquivalenceSummary(compatible.length, different.length),
    compatible,
    different,
    checkItems,
    warnings: [...new Set([...warnings, ...profileComparison.warnings])],
    profileScoring: {
      scoredComparisons: profileComparison.scoredComparisons,
    },
  };
}

import type { AttributeComparison } from "@/types/compatibility";

import type { CanonicalValveFunctionId } from "./canonicalValveFunctions";
import type { ValveFunctionMatchType } from "./hydraulicFunctionAliases";
import {
    behaviorsHaveDifferentCenter,
    behaviorsHaveSimilarTags,
    isSameManufacturerSeriesToken,
    resolveHydraulicFunctionBehavior,
} from "./hydraulicFunctionBehavior";

export interface CompareValveFunctionBehaviorResult {
  comparison: AttributeComparison;
  matchType: ValveFunctionMatchType;
  canonicalFunctionId: CanonicalValveFunctionId;
  requiresCatalogCheck: boolean;
  statusMessageTr?: string;
}

const MSG_EXACT_SAME_CODE = (token: string) =>
  `Sürgü/fonksiyon kodu aynı: ${token}`;
const MSG_SIMILAR_BEHAVIOR =
  "Sürgü/fonksiyon davranışı benzer olabilir. Katalog sembolüyle doğrulanmalıdır.";
const MSG_DIFFERENT_CENTER =
  "Merkez konumu / sürgü davranışı farklı olabilir. Katalog sembolüyle doğrulanmalıdır.";
const MSG_MISSING_BEHAVIOR =
  "Sürgü/fonksiyon sembolü katalogdan kontrol edilmelidir.";

function canClaimFullyCompatible(
  source: NonNullable<ReturnType<typeof resolveHydraulicFunctionBehavior>>,
  target: NonNullable<ReturnType<typeof resolveHydraulicFunctionBehavior>>,
): boolean {
  return (
    isSameManufacturerSeriesToken(source, target) &&
    source.confidence === "high" &&
    target.confidence === "high" &&
    !source.requiresCatalogCheck &&
    !target.requiresCatalogCheck
  );
}

export function compareValveFunctionBehavior(options: {
  label: string;
  source: { manufacturer: string; series: string; token: string | null };
  target: { manufacturer: string; series: string; token: string | null };
}): CompareValveFunctionBehaviorResult {
  const sourceToken = options.source.token?.trim().toUpperCase() ?? null;
  const targetToken = options.target.token?.trim().toUpperCase() ?? null;

  const sourceDisplay = sourceToken ?? "Doğrulanamadı";
  const targetDisplay = targetToken ?? "Doğrulanamadı";

  if (!sourceToken || !targetToken) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: "unknownOrCheck",
      },
      matchType: "unknown",
      canonicalFunctionId: "unknown",
      requiresCatalogCheck: true,
      statusMessageTr: MSG_MISSING_BEHAVIOR,
    };
  }

  const sourceBehavior = resolveHydraulicFunctionBehavior({
    manufacturer: options.source.manufacturer,
    series: options.source.series,
    token: sourceToken,
  });
  const targetBehavior = resolveHydraulicFunctionBehavior({
    manufacturer: options.target.manufacturer,
    series: options.target.series,
    token: targetToken,
  });

  if (!sourceBehavior || !targetBehavior) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: "unknownOrCheck",
      },
      matchType: "unknown",
      canonicalFunctionId: "unknown",
      requiresCatalogCheck: true,
      statusMessageTr: MSG_MISSING_BEHAVIOR,
    };
  }

  if (isSameManufacturerSeriesToken(sourceBehavior, targetBehavior)) {
    if (canClaimFullyCompatible(sourceBehavior, targetBehavior)) {
      return {
        comparison: {
          label: options.label,
          sourceDisplay,
          targetDisplay,
          status: "compatible",
        },
        matchType: "exact_token_match",
        canonicalFunctionId: "unknown",
        requiresCatalogCheck: false,
        statusMessageTr: MSG_EXACT_SAME_CODE(sourceToken),
      };
    }

    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: "compatible",
      },
      matchType: "exact_token_match",
      canonicalFunctionId: "unknown",
      requiresCatalogCheck:
        sourceBehavior.requiresCatalogCheck ||
        targetBehavior.requiresCatalogCheck,
      statusMessageTr: MSG_EXACT_SAME_CODE(sourceToken),
    };
  }

  if (behaviorsHaveDifferentCenter(sourceBehavior, targetBehavior)) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: "different",
      },
      matchType: "different",
      canonicalFunctionId: "unknown",
      requiresCatalogCheck: true,
      statusMessageTr: MSG_DIFFERENT_CENTER,
    };
  }

  const sourceConfident =
    sourceBehavior.confidence === "high" ||
    sourceBehavior.confidence === "medium";
  const targetConfident =
    targetBehavior.confidence === "high" ||
    targetBehavior.confidence === "medium";

  if (
    sourceConfident &&
    targetConfident &&
    behaviorsHaveSimilarTags(sourceBehavior, targetBehavior)
  ) {
    return {
      comparison: {
        label: options.label,
        sourceDisplay,
        targetDisplay,
        status: "unknownOrCheck",
      },
      matchType: "possible_same_family",
      canonicalFunctionId: "unknown",
      requiresCatalogCheck: true,
      statusMessageTr: MSG_SIMILAR_BEHAVIOR,
    };
  }

  return {
    comparison: {
      label: options.label,
      sourceDisplay,
      targetDisplay,
      status: "unknownOrCheck",
    },
    matchType: "unknown",
    canonicalFunctionId: "unknown",
    requiresCatalogCheck: true,
    statusMessageTr: MSG_MISSING_BEHAVIOR,
  };
}

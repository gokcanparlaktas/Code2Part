import type { HydraulicFunctionCenterCondition } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import { buildHydraulicCenterTypeCreatorOptions } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import {
  getRexrothWE6SpoolSemantics,
  type RexrothWE6BaseSpoolSymbol,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import {
  getYukenDSGSpoolSemantics,
  type YukenDSGSpoolFunctionCode,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/yukenDSGSpoolSemantics';
import { formatCenterConditionSelectionLabel } from '@/domain/presentation/formatCenterTypeDisplay';

/** User-facing center types in stable order for completion chips. */
export const HYDRAULIC_CENTER_TYPE_SELECTION_ORDER: HydraulicFunctionCenterCondition[] = [
  'closed_center',
  'tandem_center',
  'open_center',
  'partially_open',
  'float_center',
];

function creatorOptionsByCenterCondition(): Map<
  HydraulicFunctionCenterCondition,
  (typeof buildHydraulicCenterTypeCreatorOptions extends () => infer R ? R : never)[number]
> {
  const map = new Map<
    HydraulicFunctionCenterCondition,
    ReturnType<typeof buildHydraulicCenterTypeCreatorOptions>[number]
  >();

  for (const option of buildHydraulicCenterTypeCreatorOptions()) {
    const center = option.centerCondition as HydraulicFunctionCenterCondition | null;
    if (!center || map.has(center)) {
      continue;
    }
    map.set(center, option);
  }

  return map;
}

export function buildRexrothCenterTypeCompletionOptions(): Array<{
  token: string;
  displayValue: string;
}> {
  const byCenter = creatorOptionsByCenterCondition();

  return HYDRAULIC_CENTER_TYPE_SELECTION_ORDER.flatMap((centerCondition) => {
    const option = byCenter.get(centerCondition);
    const token = option?.rexrothSpoolToken;
    if (!token) {
      return [];
    }

    if (!getRexrothWE6SpoolSemantics(token)) {
      return [];
    }

    return [
      {
        token,
        displayValue: formatCenterConditionSelectionLabel(centerCondition),
      },
    ];
  });
}

export function formatRexrothSpoolDisplayLabel(token: string): string {
  for (const option of buildHydraulicCenterTypeCreatorOptions()) {
    if (option.rexrothSpoolToken === token && option.centerCondition) {
      return formatCenterConditionSelectionLabel(
        option.centerCondition as HydraulicFunctionCenterCondition
      );
    }
  }

  const semantics = getRexrothWE6SpoolSemantics(token);
  if (!semantics) {
    return 'Katalogdan kontrol';
  }

  return formatCenterConditionSelectionLabel(semantics.centerCondition);
}

export function buildYukenCenterTypeCompletionOptions(): Array<{
  token: string;
  displayValue: string;
}> {
  const byCenter = creatorOptionsByCenterCondition();

  return HYDRAULIC_CENTER_TYPE_SELECTION_ORDER.flatMap((centerCondition) => {
    const option = byCenter.get(centerCondition);
    const token = option?.yukenFunctionToken;
    if (!token) {
      return [];
    }

    const semantics = getYukenDSGSpoolSemantics(token);
    if (!semantics || semantics.centerCondition !== centerCondition) {
      return [];
    }

    return [
      {
        token,
        displayValue: formatCenterConditionSelectionLabel(centerCondition),
      },
    ];
  });
}

/** Catalog-derived Rexroth spool for a center condition (portState ingest). */
export function rexrothSpoolTokenForCenterCondition(
  centerCondition: HydraulicFunctionCenterCondition
): RexrothWE6BaseSpoolSymbol | null {
  const option = creatorOptionsByCenterCondition().get(centerCondition);
  const token = option?.rexrothSpoolToken;
  if (!token || !getRexrothWE6SpoolSemantics(token)) {
    return null;
  }
  return token as RexrothWE6BaseSpoolSymbol;
}

/** Catalog-derived Yuken function for a center condition (portState ingest). */
export function yukenFunctionTokenForCenterCondition(
  centerCondition: HydraulicFunctionCenterCondition
): YukenDSGSpoolFunctionCode | null {
  const option = creatorOptionsByCenterCondition().get(centerCondition);
  const token = option?.yukenFunctionToken;
  if (!token) {
    return null;
  }
  const semantics = getYukenDSGSpoolSemantics(token);
  if (!semantics || semantics.centerCondition !== centerCondition) {
    return null;
  }
  return token as YukenDSGSpoolFunctionCode;
}

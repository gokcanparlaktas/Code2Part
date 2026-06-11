import type { HydraulicFunctionCenterCondition } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import { buildHydraulicCenterTypeCreatorOptions } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import {
  getRexrothWE6SpoolSemantics,
  type RexrothWE6BaseSpoolSymbol,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import {
  getYukenDSGSpoolSemantics,
  type YukenDSGSpoolFunctionCode,
  yukenOrderingTokenForCenterCondition,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/yukenDSGSpoolSemantics';
import {
  centerTypePartsFromPortState,
  formatCenterConditionSelectionLabel,
} from '@/domain/presentation/formatCenterTypeDisplay';

/** User-facing center types in stable order for completion chips. */
export const HYDRAULIC_CENTER_TYPE_SELECTION_ORDER: HydraulicFunctionCenterCondition[] = [
  'closed_center',
  'tandem_center',
  'open_center',
  'partially_open',
  'float_center',
];

const PRIMARY_CENTER_TO_SELECTION: Record<string, HydraulicFunctionCenterCondition> = {
  'Kapalı merkez': 'closed_center',
  'Açık merkez': 'open_center',
  'Tandem merkez': 'tandem_center',
  'Yüzer merkez': 'float_center',
  'Kısmen açık merkez': 'partially_open',
};

type CenterTypeCreatorOption = ReturnType<typeof buildHydraulicCenterTypeCreatorOptions>[number];

function selectionCenterCondition(
  option: CenterTypeCreatorOption
): HydraulicFunctionCenterCondition | null {
  if (option.portState) {
    const primary = centerTypePartsFromPortState(option.portState)?.primary;
    const fromPort = primary ? PRIMARY_CENTER_TO_SELECTION[primary] : null;
    if (fromPort) {
      return fromPort;
    }
  }

  const stored = option.centerCondition;
  if (
    stored &&
    HYDRAULIC_CENTER_TYPE_SELECTION_ORDER.includes(stored as HydraulicFunctionCenterCondition)
  ) {
    return stored as HydraulicFunctionCenterCondition;
  }

  return null;
}

function scoreCenterTypeOption(
  option: CenterTypeCreatorOption,
  center: HydraulicFunctionCenterCondition
): number {
  let score = 0;
  const rexroth = option.rexrothSpoolToken?.trim().toUpperCase() ?? '';

  if (rexroth && getRexrothWE6SpoolSemantics(rexroth)) {
    score += 10;
    if (rexroth.length === 1) {
      score += 5;
    }
  }

  if (center === 'closed_center' && rexroth === 'E') {
    score += 20;
  }

  if (option.yukenFunctionToken && /^[0-9][CBD]\d{1,2}$/i.test(option.yukenFunctionToken)) {
    score += 8;
  }

  return score;
}

function creatorOptionsByCenterCondition(): Map<
  HydraulicFunctionCenterCondition,
  CenterTypeCreatorOption
> {
  const map = new Map<HydraulicFunctionCenterCondition, CenterTypeCreatorOption>();

  for (const option of buildHydraulicCenterTypeCreatorOptions()) {
    const center = selectionCenterCondition(option);
    if (!center) {
      continue;
    }

    const existing = map.get(center);
    if (!existing || scoreCenterTypeOption(option, center) > scoreCenterTypeOption(existing, center)) {
      map.set(center, option);
    }
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
  return HYDRAULIC_CENTER_TYPE_SELECTION_ORDER.flatMap((centerCondition) => {
    const token = yukenOrderingTokenForCenterCondition(centerCondition);
    if (!token) {
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
  const token = yukenOrderingTokenForCenterCondition(centerCondition);
  if (!token) {
    return null;
  }
  const semantics = getYukenDSGSpoolSemantics(token);
  if (!semantics || semantics.centerCondition !== centerCondition) {
    return null;
  }
  return token as YukenDSGSpoolFunctionCode;
}

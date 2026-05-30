import type { HydraulicFunctionCenterCondition } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import {
  getRexrothWE6SpoolSemantics,
  REXROTH_WE6_CENTER_CONDITION_LABEL_TR,
  type RexrothWE6BaseSpoolSymbol,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/rexrothWE6SpoolSemantics';
import {
  getYukenDSGSpoolSemantics,
  YUKEN_DSG_CENTER_CONDITION_LABEL_TR,
  type YukenDSGSpoolFunctionCode,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/yukenDSGSpoolSemantics';

/** User-facing center types in stable order for completion chips. */
export const HYDRAULIC_CENTER_TYPE_SELECTION_ORDER: HydraulicFunctionCenterCondition[] = [
  'closed_center',
  'tandem_center',
  'open_center',
  'partially_open',
  'float_center',
];

/** Best Rexroth spool letter for cross-brand equivalent generation. */
export const REXROTH_PREFERRED_SPOOL_BY_CENTER: Partial<
  Record<HydraulicFunctionCenterCondition, RexrothWE6BaseSpoolSymbol>
> = {
  closed_center: 'E',
  tandem_center: 'C',
  open_center: 'D',
  partially_open: 'J',
  float_center: 'H',
};

/** Best Yuken function code for cross-brand equivalent generation. */
export const YUKEN_PREFERRED_FUNCTION_BY_CENTER: Partial<
  Record<HydraulicFunctionCenterCondition, YukenDSGSpoolFunctionCode>
> = {
  closed_center: '3C2',
  tandem_center: '3C4',
  open_center: '3C60',
  partially_open: '3C9',
  float_center: '3C40',
};

export function buildRexrothCenterTypeCompletionOptions(): Array<{
  token: string;
  displayValue: string;
}> {
  return HYDRAULIC_CENTER_TYPE_SELECTION_ORDER.flatMap((centerCondition) => {
    const token = REXROTH_PREFERRED_SPOOL_BY_CENTER[centerCondition];
    if (!token) {
      return [];
    }

    if (!getRexrothWE6SpoolSemantics(token)) {
      return [];
    }

    return [
      {
        token,
        displayValue: REXROTH_WE6_CENTER_CONDITION_LABEL_TR[centerCondition],
      },
    ];
  });
}

export function formatRexrothSpoolDisplayLabel(token: string): string {
  const fromPreferred = (
    Object.entries(REXROTH_PREFERRED_SPOOL_BY_CENTER) as Array<
      [HydraulicFunctionCenterCondition, RexrothWE6BaseSpoolSymbol]
    >
  ).find(([, spool]) => spool === token);
  if (fromPreferred) {
    return REXROTH_WE6_CENTER_CONDITION_LABEL_TR[fromPreferred[0]];
  }

  const semantics = getRexrothWE6SpoolSemantics(token as RexrothWE6BaseSpoolSymbol);
  if (!semantics) {
    return 'Katalogdan kontrol';
  }

  return REXROTH_WE6_CENTER_CONDITION_LABEL_TR[semantics.centerCondition];
}

export function buildYukenCenterTypeCompletionOptions(): Array<{
  token: string;
  displayValue: string;
}> {
  return HYDRAULIC_CENTER_TYPE_SELECTION_ORDER.flatMap((centerCondition) => {
    const token = YUKEN_PREFERRED_FUNCTION_BY_CENTER[centerCondition];
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
        displayValue: YUKEN_DSG_CENTER_CONDITION_LABEL_TR[centerCondition],
      },
    ];
  });
}

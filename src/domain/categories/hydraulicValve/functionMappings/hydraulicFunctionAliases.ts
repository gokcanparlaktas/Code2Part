import type { CanonicalValveFunctionId } from './canonicalValveFunctions';

export type ValveFunctionMatchType =
  | 'exact_token_match'
  | 'same_canonical_function'
  | 'possible_same_family'
  | 'different'
  | 'unknown';

export type HydraulicFunctionAlias = {
  manufacturer: string;
  series: string;
  token: string;
  canonicalFunctionId: CanonicalValveFunctionId;
  confidence: 'high' | 'medium' | 'low';
  requiresCatalogCheck: boolean;
  note?: string;
};

import { getHydraulicFunctionAliasesFromCatalog } from '@/domain/catalog/adapters/catalogV2Adapter';

/** @deprecated Prefer catalog v2 via getHydraulicFunctionAliasesFromCatalog */
export const HYDRAULIC_FUNCTION_ALIASES: HydraulicFunctionAlias[] =
  getHydraulicFunctionAliasesFromCatalog();


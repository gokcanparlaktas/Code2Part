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

export const HYDRAULIC_FUNCTION_ALIASES: HydraulicFunctionAlias[] = [
  {
    manufacturer: 'Rexroth',
    series: '4WE',
    token: 'E',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'medium',
    requiresCatalogCheck: true,
    note: 'Rexroth WE serisi sembol harfleri üreticiye göre değişebilir.',
  },
  {
    manufacturer: 'Yuken',
    series: 'DSG',
    token: '3C2',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'medium',
    requiresCatalogCheck: true,
    note: 'Yuken DSG spool type kodları katalogdan doğrulanmalıdır.',
  },
  {
    manufacturer: 'Vickers',
    series: 'DG4V',
    token: '2A',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'low',
    requiresCatalogCheck: true,
    note: 'Vickers sembol kodları model yapısına göre değişebilir.',
  },
  {
    manufacturer: 'Atos',
    series: 'DHI',
    token: '0711',
    canonicalFunctionId: 'closed_center_4_3',
    confidence: 'low',
    requiresCatalogCheck: true,
    note: 'Atos konfigurasyon kodları katalogdan doğrulanmalıdır.',
  },
  {
    manufacturer: 'Yuken',
    series: 'DSG',
    token: '3C12',
    canonicalFunctionId: 'tandem_center_4_3',
    confidence: 'medium',
    requiresCatalogCheck: true,
    note: 'Yuken DSG spool type kodları katalogdan doğrulanmalıdır.',
  },
];


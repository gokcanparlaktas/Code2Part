import type { ConfidenceLevel } from './product';

export interface SearchHistoryEntry {
  id: string;
  originalInput: string;
  normalizedCode: string;
  identified: boolean;
  brand: string | null;
  series: string | null;
  confidence: ConfidenceLevel | null;
  searchedAt: string;
}

export interface UnresolvedSearchEntry {
  id: string;
  originalInput: string;
  normalizedCode: string;
  savedAt: string;
}

export interface SearchHistoryStore {
  searches: SearchHistoryEntry[];
  unresolved: UnresolvedSearchEntry[];
}

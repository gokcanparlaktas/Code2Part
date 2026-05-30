import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ProductIdentification } from '@/types/product';
import type {
  SearchHistoryEntry,
  SearchHistoryStore,
  UnresolvedSearchEntry,
} from '@/types/searchHistory';

import { dedupeSearchHistoryByNormalizedCode } from './searchHistoryDedupe';

const STORAGE_KEY = '@code2part/search_store';
const MAX_HISTORY = 50;

const memoryStore: SearchHistoryStore = {
  searches: [],
  unresolved: [],
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readStore(): Promise<SearchHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { searches: [], unresolved: [] };
    }
    const parsed = JSON.parse(raw) as SearchHistoryStore;
    return {
      searches: parsed.searches ?? [],
      unresolved: parsed.unresolved ?? [],
    };
  } catch {
    return {
      searches: [...memoryStore.searches],
      unresolved: [...memoryStore.unresolved],
    };
  }
}

async function writeStore(store: SearchHistoryStore): Promise<void> {
  memoryStore.searches = store.searches;
  memoryStore.unresolved = store.unresolved;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // In-memory fallback already updated
  }
}

export async function recordSearch(
  identification: ProductIdentification
): Promise<SearchHistoryEntry> {
  const store = await readStore();
  const identified = identification.outcome === 'full';

  const entry: SearchHistoryEntry = {
    id: createId(),
    originalInput: identification.inputCode,
    normalizedCode: identification.normalizedCode,
    identified,
    brand: identification.brand.value,
    series: identification.series.value,
    productType: identification.productType.value,
    confidence: identified ? identification.confidence : null,
    searchedAt: new Date().toISOString(),
  };

  store.searches = dedupeSearchHistoryByNormalizedCode(store.searches, identification.normalizedCode);
  store.searches = [entry, ...store.searches].slice(0, MAX_HISTORY);
  await writeStore(store);
  return entry;
}

export async function saveUnresolvedSearch(
  originalInput: string,
  normalizedCode: string
): Promise<UnresolvedSearchEntry> {
  const store = await readStore();
  const existing = store.unresolved.find(
    (item) => item.normalizedCode === normalizedCode
  );

  if (existing) {
    return existing;
  }

  const entry: UnresolvedSearchEntry = {
    id: createId(),
    originalInput,
    normalizedCode,
    savedAt: new Date().toISOString(),
  };

  store.unresolved = [entry, ...store.unresolved];
  await writeStore(store);
  return entry;
}

export async function isUnresolvedSaved(normalizedCode: string): Promise<boolean> {
  const store = await readStore();
  return store.unresolved.some((item) => item.normalizedCode === normalizedCode);
}

export async function getSearchHistory(): Promise<SearchHistoryEntry[]> {
  const store = await readStore();
  return store.searches;
}

export async function getUnresolvedSearches(): Promise<UnresolvedSearchEntry[]> {
  const store = await readStore();
  return store.unresolved;
}

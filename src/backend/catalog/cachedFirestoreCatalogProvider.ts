import { getFirestore } from 'firebase-admin/firestore';

import { activePointerFirestorePath } from '../../../scripts/catalog-data-firestore/buildImportPlan';

import {
  FirestoreCatalogProvider,
  type FirestoreCatalogProviderConfig,
} from './FirestoreCatalogProvider';

let cachedProvider: FirestoreCatalogProvider | null = null;
let cachedActiveVersion: string | null = null;

export async function readActiveCatalogVersion(): Promise<string | null> {
  const snapshot = await getFirestore().doc(activePointerFirestorePath()).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown> | undefined;
  const version = data?.catalogVersion;
  return typeof version === 'string' && version.trim() ? version.trim() : null;
}

export function resetCachedFirestoreCatalogProviderForTests(): void {
  cachedProvider = null;
  cachedActiveVersion = null;
}

export async function getCachedFirestoreCatalogProvider(
  config: Omit<FirestoreCatalogProviderConfig, 'catalogVersion'> = {}
): Promise<FirestoreCatalogProvider> {
  const activeVersion = await readActiveCatalogVersion();

  if (
    cachedProvider &&
    cachedProvider.isInitialized() &&
    activeVersion &&
    cachedActiveVersion === activeVersion
  ) {
    return cachedProvider;
  }

  cachedProvider = new FirestoreCatalogProvider({
    ...config,
    catalogVersion: activeVersion ?? undefined,
  });
  await cachedProvider.initialize();
  cachedActiveVersion = cachedProvider.catalogVersion ?? activeVersion;
  return cachedProvider;
}

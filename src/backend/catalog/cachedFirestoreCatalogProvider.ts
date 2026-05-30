import { getFirestore } from 'firebase-admin/firestore';

import { logResolverCatalogProvider } from '@/backend/http/logResolverInternalError';

import { activePointerFirestorePath } from '../../../scripts/catalog-data-firestore/buildImportPlan';

import {
  FirestoreCatalogProvider,
  ensureBackendFirebaseInitialized,
  type FirestoreCatalogProviderConfig,
} from './FirestoreCatalogProvider';

let cachedProvider: FirestoreCatalogProvider | null = null;
let cachedActiveVersion: string | null = null;

export async function readActiveCatalogVersion(
  config: Omit<FirestoreCatalogProviderConfig, 'catalogVersion'> = {}
): Promise<string | null> {
  await ensureBackendFirebaseInitialized(config);

  const pointerPath = activePointerFirestorePath();
  logResolverCatalogProvider('Reading catalogDataMeta/active', { pointerPath });

  const snapshot = await getFirestore().doc(pointerPath).get();
  if (!snapshot.exists) {
    logResolverCatalogProvider('Active catalog pointer not found', { pointerPath });
    return null;
  }

  const data = snapshot.data() as Record<string, unknown> | undefined;
  const version = data?.catalogVersion;
  const activeVersion = typeof version === 'string' && version.trim() ? version.trim() : null;
  logResolverCatalogProvider('Active catalogVersion resolved', {
    catalogVersion: activeVersion,
  });
  return activeVersion;
}

export function resetCachedFirestoreCatalogProviderForTests(): void {
  cachedProvider = null;
  cachedActiveVersion = null;
}

export async function getCachedFirestoreCatalogProvider(
  config: Omit<FirestoreCatalogProviderConfig, 'catalogVersion'> = {}
): Promise<FirestoreCatalogProvider> {
  const activeVersion = await readActiveCatalogVersion(config);

  if (
    cachedProvider &&
    cachedProvider.isInitialized() &&
    activeVersion &&
    cachedActiveVersion === activeVersion
  ) {
    logResolverCatalogProvider('Reusing cached FirestoreCatalogProvider', {
      catalogVersion: activeVersion,
    });
    return cachedProvider;
  }

  logResolverCatalogProvider('Initializing FirestoreCatalogProvider', {
    activeCatalogVersion: activeVersion,
    cacheHit: false,
  });

  cachedProvider = new FirestoreCatalogProvider({
    ...config,
    catalogVersion: activeVersion ?? undefined,
  });
  await cachedProvider.initialize();
  cachedActiveVersion = cachedProvider.catalogVersion ?? activeVersion;

  logResolverCatalogProvider('FirestoreCatalogProvider ready', {
    catalogVersion: cachedActiveVersion,
  });

  return cachedProvider;
}

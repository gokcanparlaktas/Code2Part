import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

export async function ensureCatalogProviderInitialized(
  catalogProvider?: CatalogDataProvider
): Promise<CatalogDataProvider> {
  const provider = catalogProvider ?? getDefaultCatalogDataProvider();
  if (provider.initialize) {
    await provider.initialize();
  }
  return provider;
}

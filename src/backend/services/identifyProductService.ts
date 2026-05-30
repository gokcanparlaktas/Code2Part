import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import {
  mapIdentifyProductResponse,
  type IdentifyProductResponseDto,
} from '@/backend/dto/mapIdentifyProductResponse';
import { ensureCatalogProviderInitialized } from '@/backend/services/ensureCatalogProviderInitialized';

export interface IdentifyProductServiceOptions {
  code: string;
  catalogProvider?: CatalogDataProvider;
}

export async function identifyProductService(
  options: IdentifyProductServiceOptions
): Promise<IdentifyProductResponseDto> {
  const catalogProvider = await ensureCatalogProviderInitialized(options.catalogProvider);
  const normalized = normalizeCode(options.code);
  const identification = identifyProduct(options.code, normalized);

  return mapIdentifyProductResponse({
    identification,
    catalogProvider,
    inputCode: options.code,
  });
}

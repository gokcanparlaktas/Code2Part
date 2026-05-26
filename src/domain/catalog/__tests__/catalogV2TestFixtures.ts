import { getCatalogV2Bundle } from '@/domain/catalog/adapters/catalogV2Adapter';
import type { CatalogV2Bundle } from '@/types/catalog';

export function cloneCatalogV2Bundle(): CatalogV2Bundle {
  return JSON.parse(JSON.stringify(getCatalogV2Bundle())) as CatalogV2Bundle;
}

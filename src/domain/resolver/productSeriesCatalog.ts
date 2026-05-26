import {
  getLegacyEquivalentGroups,
  getLegacyProductSeries,
  getLegacyProductSeriesById,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import type { ProductSeriesRecord } from '@/types/product';

export function getProductSeriesById(id: string): ProductSeriesRecord | undefined {
  return getLegacyProductSeriesById(id);
}

export function getAllProductSeries(): ProductSeriesRecord[] {
  return getLegacyProductSeries();
}

export function getEquivalentGroups() {
  return getLegacyEquivalentGroups();
}

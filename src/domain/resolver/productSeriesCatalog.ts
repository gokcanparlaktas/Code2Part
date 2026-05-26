import equivalentSeriesData from '@/data/equivalentSeries.json';
import hydraulicValveSeriesData from '@/data/hydraulicValveSeries.json';
import productSeriesData from '@/data/productSeries.json';
import type { ProductSeriesRecord } from '@/types/product';

const productSeries: ProductSeriesRecord[] = [
  ...(productSeriesData as ProductSeriesRecord[]),
  ...(hydraulicValveSeriesData as ProductSeriesRecord[]),
];

export function getProductSeriesById(id: string): ProductSeriesRecord | undefined {
  return productSeries.find((series) => series.id === id);
}

export function getAllProductSeries(): ProductSeriesRecord[] {
  return productSeries;
}

export function getEquivalentGroups() {
  return equivalentSeriesData;
}

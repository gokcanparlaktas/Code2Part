import type { ProductIdentification } from '@/types/product';

/** Portable identification fields returned by identify / equivalents APIs. */
export interface IdentificationSnapshotDto {
  matched: boolean;
  resolverCategoryKey: string | null;
  seriesId: string | null;
  productType: string | null;
  standardFamily: string | null;
  boreMm: number | null;
  outsideDiameterMm: number | null;
  widthMm: number | null;
}

export function mapIdentificationSnapshot(
  identification: ProductIdentification
): IdentificationSnapshotDto {
  const width =
    identification.bearingWidth?.value ?? identification.stroke.value ?? null;

  return {
    matched: identification.matched,
    resolverCategoryKey: identification.resolverCategoryKey,
    seriesId: identification.seriesId,
    productType: identification.productType.value,
    standardFamily: identification.standardFamily.value,
    boreMm: identification.bore.value,
    outsideDiameterMm: identification.outsideDiameter?.value ?? null,
    widthMm: width,
  };
}

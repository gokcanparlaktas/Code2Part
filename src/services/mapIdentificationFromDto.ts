import type { IdentificationSnapshotDto } from '@/backend/dto/mapIdentificationSnapshot';
import type {
  ProductIdentification,
  ProductResolverCategory,
  TechnicalAttribute,
} from '@/types/product';

function attributeFromSnapshot<T extends string | number>(
  value: T | null,
  evidence: TechnicalAttribute<T>['evidence'] = 'series_table'
): TechnicalAttribute<T> {
  return {
    value,
    evidence: value === null ? 'unknown' : evidence,
    requiresCheck: value === null,
  };
}

export function mapIdentificationFromDto(
  inputCode: string,
  dto: IdentificationSnapshotDto & {
    normalizedCode: string;
    manufacturer: string | null;
    series: string | null;
    category: string | null;
    outcome: ProductIdentification['outcome'];
    confidence: ProductIdentification['confidence'];
  }
): ProductIdentification {
  const isBearing = dto.resolverCategoryKey === 'rolling_bearing';
  const width = dto.widthMm;

  return {
    inputCode,
    normalizedCode: dto.normalizedCode,
    seriesId: dto.seriesId,
    resolverCategoryKey: dto.resolverCategoryKey as ProductResolverCategory | null,
    matched: dto.matched,
    outcome: dto.outcome,
    brand: attributeFromSnapshot(dto.manufacturer),
    series: attributeFromSnapshot(dto.series, 'code'),
    productType: attributeFromSnapshot(dto.productType),
    productCategory: attributeFromSnapshot(dto.category),
    standardFamily: attributeFromSnapshot(dto.standardFamily, 'standard'),
    bore: attributeFromSnapshot(dto.boreMm, 'code'),
    stroke: attributeFromSnapshot(width, isBearing ? 'series_table' : 'code'),
    outsideDiameter:
      dto.outsideDiameterMm != null
        ? attributeFromSnapshot(dto.outsideDiameterMm, 'series_table')
        : undefined,
    bearingWidth:
      isBearing && width != null ? attributeFromSnapshot(width, 'series_table') : undefined,
    confidence: dto.confidence,
  };
}

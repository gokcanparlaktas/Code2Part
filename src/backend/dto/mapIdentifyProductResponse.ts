import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import {
  USER_EVIDENCE_FROM_CODE_TR,
  USER_EVIDENCE_FROM_SERIES_TR,
} from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { calculateProductReliability } from '@/domain/reliability/calculateProductReliability';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { assertNoForbiddenBackendResponseKeys } from './backendResponseSecurity';

export interface IdentifyProductTechnicalAttributeDto {
  key: string;
  label: string;
  value: string;
  evidence: string;
  requiresCheck: boolean;
}

export interface IdentifyProductDetailRowDto {
  label: string;
  value: string;
  evidence: string;
  requiresCheck: boolean;
}

export interface IdentifyProductResponseDto {
  normalizedCode: string;
  manufacturer: string | null;
  series: string | null;
  category: string | null;
  outcome: ProductIdentification['outcome'];
  confidence: ProductIdentification['confidence'];
  technicalAttributes: IdentifyProductTechnicalAttributeDto[];
  productDetailRows: IdentifyProductDetailRowDto[];
  warnings: string[];
}

function evidenceLabelForAttribute(attribute: TechnicalAttribute): string {
  switch (attribute.evidence) {
    case 'code':
      return USER_EVIDENCE_FROM_CODE_TR;
    case 'series_table':
      return USER_EVIDENCE_FROM_SERIES_TR;
    case 'standard':
      return 'Standart bilgisi';
    case 'inferred':
      return 'Tahmini';
    default:
      return 'Bilinmiyor';
  }
}

function mapTechnicalAttributes(
  attributes: TechnicalAttribute[]
): IdentifyProductTechnicalAttributeDto[] {
  return attributes.map((attribute) => ({
    key: attribute.key,
    label: attribute.label,
    value:
      attribute.value === null || attribute.value === undefined
        ? 'Belirsiz'
        : String(attribute.value),
    evidence: evidenceLabelForAttribute(attribute),
    requiresCheck:
      attribute.evidence === 'unknown' ||
      attribute.evidence === 'inferred' ||
      attribute.confidence === 'low' ||
      attribute.confidence === 'unknown',
  }));
}

function collectIdentifyWarnings(identification: ProductIdentification): string[] {
  const warnings = new Set<string>();
  const reliability = calculateProductReliability(identification);

  if (reliability.warningTitleTr) {
    warnings.add(reliability.warningTitleTr);
  }
  if (reliability.warningMessageTr) {
    warnings.add(reliability.warningMessageTr);
  }
  if (reliability.seriesOnlyNoticeTr) {
    warnings.add(reliability.seriesOnlyNoticeTr);
  }

  return [...warnings];
}

export function mapIdentifyProductResponse(options: {
  identification: ProductIdentification;
  catalogProvider?: CatalogDataProvider;
}): IdentifyProductResponseDto {
  const attributes = getTechnicalAttributes(options.identification);
  const productDetailRows = buildProductDetailRows(options.identification, {
    catalogProvider: options.catalogProvider,
  });

  const dto: IdentifyProductResponseDto = {
    normalizedCode: options.identification.normalizedCode,
    manufacturer: options.identification.brand.value,
    series: options.identification.series.value,
    category: options.identification.productCategory.value,
    outcome: options.identification.outcome,
    confidence: options.identification.confidence,
    technicalAttributes: mapTechnicalAttributes(attributes),
    productDetailRows: productDetailRows.map((row) => ({
      label: row.label,
      value: row.value,
      evidence: row.evidence,
      requiresCheck: row.requiresCheck,
    })),
    warnings: collectIdentifyWarnings(options.identification),
  };

  assertNoForbiddenBackendResponseKeys(dto);
  return dto;
}

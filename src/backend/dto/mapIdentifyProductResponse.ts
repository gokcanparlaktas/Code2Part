import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import {
  USER_EVIDENCE_FROM_CODE_TR,
  USER_EVIDENCE_FROM_SERIES_TR,
} from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { calculateProductReliability } from '@/domain/reliability/calculateProductReliability';
import {
  collectRexrothWEParserDiagnostics,
  collectRexrothWEParserWarnings,
} from '@/domain/resolver/collectRexrothWEParserDiagnostics';
import type { ProductIdentification } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

import { assertNoForbiddenBackendResponseKeys } from './backendResponseSecurity';
import { mapIdentificationSnapshot } from './mapIdentificationSnapshot';

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
  matched: boolean;
  resolverCategoryKey: string | null;
  seriesId: string | null;
  productType: string | null;
  standardFamily: string | null;
  boreMm: number | null;
  outsideDiameterMm: number | null;
  widthMm: number | null;
  technicalAttributes: IdentifyProductTechnicalAttributeDto[];
  productDetailRows: IdentifyProductDetailRowDto[];
  warnings: string[];
  parseCompleteness?: 'fully_parsed' | 'partial' | 'unknown';
  unknownTokens?: string[];
  unresolvedSegments?: string[];
  parserNotes?: string[];
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

function collectIdentifyWarnings(
  identification: ProductIdentification,
  inputCode?: string
): string[] {
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

  if (inputCode) {
    for (const message of collectRexrothWEParserWarnings(inputCode, identification)) {
      warnings.add(message);
    }
  }

  return [...warnings];
}

export function mapIdentifyProductResponse(options: {
  identification: ProductIdentification;
  catalogProvider?: CatalogDataProvider;
  inputCode?: string;
}): IdentifyProductResponseDto {
  const attributes = getTechnicalAttributes(options.identification);
  const productDetailRows = buildProductDetailRows(options.identification, {
    catalogProvider: options.catalogProvider,
  });

  const snapshot = mapIdentificationSnapshot(options.identification);

  const dto: IdentifyProductResponseDto = {
    normalizedCode: options.identification.normalizedCode,
    manufacturer: options.identification.brand.value,
    series: options.identification.series.value,
    category: options.identification.productCategory.value,
    outcome: options.identification.outcome,
    confidence: options.identification.confidence,
    ...snapshot,
    technicalAttributes: mapTechnicalAttributes(attributes),
    productDetailRows: productDetailRows.map((row) => ({
      label: row.label,
      value: row.value,
      evidence: row.evidence,
      requiresCheck: row.requiresCheck,
    })),
    warnings: collectIdentifyWarnings(
      options.identification,
      options.inputCode ?? options.identification.inputCode
    ),
  };

  const parserDiagnostics = collectRexrothWEParserDiagnostics(
    options.inputCode ?? options.identification.inputCode,
    options.identification
  );
  if (parserDiagnostics) {
    dto.parseCompleteness = parserDiagnostics.parseCompleteness;
    dto.unknownTokens = parserDiagnostics.unknownTokens;
    dto.unresolvedSegments = parserDiagnostics.unresolvedSegments;
    dto.parserNotes = parserDiagnostics.parserNotes;
  }

  assertNoForbiddenBackendResponseKeys(dto);
  return dto;
}

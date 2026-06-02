import {
  getDefaultCatalogDataProvider,
  type CatalogDataProvider,
} from '@/domain/catalogData/CatalogDataProvider';
import type { CatalogResolvedCandidate } from '@/domain/catalogData/types';

function notFound(rawToken: string): CatalogResolvedCandidate {
  return {
    found: false,
    attributeKey: 'bore_code',
    rawToken,
    confidence: 'unknown',
    needsReview: true,
    evidence: 'catalog_data',
    reviewReason: 'bore_code_not_in_catalog',
  };
}

function foundCandidate(
  rawToken: string,
  boreMm: number,
  needsReview: boolean,
  reviewReason?: string
): CatalogResolvedCandidate {
  return {
    found: true,
    attributeKey: 'bore_code',
    rawToken,
    displayCandidate: `${boreMm} mm`,
    confidence: 'medium',
    needsReview,
    evidence: 'catalog_data',
    reviewReason,
    sourceStatus: 'starter_rule',
  };
}

export function resolveBoreCodeCandidate(
  rawToken: string,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): CatalogResolvedCandidate {
  const token = rawToken.trim();
  if (!/^\d{2}$/.test(token)) {
    return notFound(rawToken);
  }

  const catalog = catalogProvider.getRollingBearingBoreCodeCatalog();
  const exactRule = catalog.boreCodeRules.find(
    (rule) => rule.rawToken !== undefined && rule.rawToken === token
  );
  if (exactRule?.boreDiameter) {
    return foundCandidate(
      rawToken,
      exactRule.boreDiameter.value,
      exactRule.needsReview ?? true
    );
  }

  const numeric = Number.parseInt(token, 10);
  if (Number.isNaN(numeric) || numeric < 4) {
    return notFound(rawToken);
  }

  const calcRule = catalog.boreCodeRules.find((rule) => rule.rawTokenPattern === '04+');
  const example = calcRule?.calculation?.examples?.find((row) => row.rawToken === token);
  if (example?.boreDiameter) {
    return foundCandidate(
      rawToken,
      example.boreDiameter.value,
      calcRule?.needsReview ?? true,
      'bore_code_from_starter_calculation_rule'
    );
  }

  const boreMm = numeric * 5;
  return foundCandidate(
    rawToken,
    boreMm,
    calcRule?.needsReview ?? true,
    'bore_code_from_starter_calculation_rule'
  );
}

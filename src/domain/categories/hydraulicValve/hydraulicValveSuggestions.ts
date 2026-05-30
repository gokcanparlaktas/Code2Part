import { getHydraulicCatalogExampleCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { ProductSeriesRecord } from '@/types/product';
import type {
  SuggestionConfidence,
  SuggestionMatchedBy,
  SuggestedProduct,
} from '@/types/suggestion';

import { computeHydraulicValveMissingFields } from './computeHydraulicValveMissingFields';
import {
  buildTokenizedQuery,
  collectSeriesPrefixes,
  isEligibleTokenQuery,
  scoreProductCodeAgainstTokens,
} from '../pneumaticCylinder/pneumaticCylinderTokenMatch';
import type { TokenMatchScore } from '../pneumaticCylinder/pneumaticCylinderTokenMatch';

function getHydraulicExampleCodes(): string[] {
  return getHydraulicCatalogExampleCodes();
}

function confidenceFromScore(score: number): SuggestionConfidence {
  if (score >= 75) {
    return 'medium';
  }
  return 'low';
}

function buildHydraulicSuggestionTextTr(
  exampleCode: string,
  brand: string,
  series: string
): string {
  return `Bu kod parçaları ${exampleCode} (${brand} ${series}) ile eşleşiyor olabilir.`;
}

export function suggestHydraulicValveProducts(
  rawInput: string,
  productSeries: ProductSeriesRecord[],
  limit = 8
): SuggestedProduct[] {
  const hydraulicSeries = productSeries.filter(
    (s) => s.resolverCategory === HYDRAULIC_VALVE_CATEGORY
  );

  const query = buildTokenizedQuery(rawInput);
  if (!isEligibleTokenQuery(query.tokens)) {
    return [];
  }

  const seriesPrefixes = collectSeriesPrefixes(hydraulicSeries);

  const scored = getHydraulicExampleCodes()
    .map((code) => {
      const normalizedCode = normalizeCode(code);
      const match = scoreProductCodeAgainstTokens(normalizedCode, query, seriesPrefixes);
      if (!match) {
        return null;
      }
      return { code: normalizedCode, match };
    })
    .filter((entry): entry is { code: string; match: TokenMatchScore } => entry !== null)
    .sort((a, b) => b.match.score - a.match.score);

  const suggestions: SuggestedProduct[] = [];
  const seen = new Set<string>();

  for (const { code, match } of scored) {
    if (suggestions.length >= limit) {
      break;
    }

    const identification = identifyProduct(code, code);
    if (!identification.seriesId || identification.resolverCategoryKey !== HYDRAULIC_VALVE_CATEGORY) {
      continue;
    }

    const series = hydraulicSeries.find((s) => s.id === identification.seriesId);
    if (!series) {
      continue;
    }

    const key = `${series.id}:${code}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    suggestions.push({
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productTypeTr: series.productType,
      standardFamily: series.standardFamily,
      equivalenceGroup: series.equivalenceGroup ?? series.equivalenceGroupId ?? '',
      confidence: confidenceFromScore(match.score),
      matchedBy: 'token_match' as SuggestionMatchedBy,
      detectedAttributes: {},
      missingFields: computeHydraulicValveMissingFields(identification),
      exampleCodeFormat: code,
      suggestionTextTr: buildHydraulicSuggestionTextTr(code, series.brand, series.series),
    });
  }

  return suggestions;
}

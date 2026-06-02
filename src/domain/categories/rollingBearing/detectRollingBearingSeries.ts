import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

import { bearingTypeNameTrForSeriesGroup } from './bearingTypeLabels';
import type { BearingSeriesDetection } from './types';

function seriesPrefixFromBase(baseCode: string): string {
  if (baseCode.length === 4) {
    return `${baseCode.slice(0, 2)}00`;
  }
  return `${baseCode.slice(0, 3)}00`;
}

function patternMatchScore(baseCode: string, pattern: string): number {
  const normalized = pattern.toLowerCase();
  const fixedDigits = normalized.replace(/x/g, '');
  if (fixedDigits.length >= 3 && !normalized.includes('x')) {
    return baseCode.startsWith(fixedDigits) ? fixedDigits.length : 0;
  }
  const prefixLength = normalized.replace(/x/g, '').length;
  if (prefixLength >= 2 && baseCode.startsWith(normalized.slice(0, 2).replace(/x/g, ''))) {
    return prefixLength;
  }
  const twoDigit = normalized.replace(/x/gi, '').slice(0, 2);
  return twoDigit.length >= 2 && baseCode.startsWith(twoDigit) ? 2 : 0;
}

export function detectRollingBearingSeries(
  baseCode: string,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): BearingSeriesDetection | null {
  const catalog = catalogProvider.getRollingBearingSeriesCatalog();

  let best: BearingSeriesDetection | null = null;
  let bestScore = 0;

  for (const group of catalog.seriesGroups) {
    const score = Math.max(
      ...group.rawTokenPatterns.map((pattern) => patternMatchScore(baseCode, pattern)),
      0
    );
    if (score <= 0 || score < bestScore) {
      continue;
    }

    bestScore = score;
    best = {
      seriesGroup: group.seriesGroup,
      seriesPrefix: seriesPrefixFromBase(baseCode),
      bearingTypeKey: group.bearingTypeCandidate,
      bearingTypeNameTr: bearingTypeNameTrForSeriesGroup(group.seriesGroup),
      confidence: group.confidence ?? 'medium',
      needsReview: group.needsReview ?? true,
    };
  }

  return best;
}

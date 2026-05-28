import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { ScoredAttributeComparison } from '@/types/compatibility';
import type { CompatibilityResult } from '@/types/compatibility';

import { compareProducts } from '@/domain/resolver/compareProducts';
import {
  findEquivalentCandidates,
  type DiscoveredEquivalentCandidate,
} from '@/domain/resolver/findEquivalentCandidates';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function candidateCode(result: CompatibilityResult): string {
  return (
    result.candidate.targetIdentification?.normalizedCode ??
    result.candidate.suggestedCode ??
    `${result.candidate.brand} ${result.candidate.series}`
  );
}

function buildFallbackScoredComparisons(result: CompatibilityResult): ScoredAttributeComparison[] {
  const byLabel = new Map<string, ScoredAttributeComparison>();

  for (const comparison of [...(result.compatible ?? []), ...(result.different ?? [])]) {
    // importance is not strictly required for audit; keep 'optional' as neutral placeholder
    byLabel.set(comparison.label, {
      ...comparison,
      importance: 'optional',
    });
  }

  for (const check of result.checkItems ?? []) {
    if (byLabel.has(check.field)) {
      continue;
    }
    byLabel.set(check.field, {
      label: check.field,
      sourceDisplay: check.sourceValue,
      targetDisplay: check.targetValue,
      status: 'unknownOrCheck',
      importance: 'optional',
    });
  }

  return [...byLabel.values()];
}

function scoredComparisonsForAudit(result: CompatibilityResult): ScoredAttributeComparison[] {
  return result.profileScoring?.scoredComparisons ?? buildFallbackScoredComparisons(result);
}

function discoveryReasonKey(discovery: DiscoveredEquivalentCandidate): string {
  const code =
    discovery.candidate.targetIdentification?.normalizedCode ??
    discovery.candidate.suggestedCode ??
    '';
  return normalizeCode(code);
}

export function buildEquivalentMatchAudit(sourceCode: string): {
  sourceCode: string;
  totalCandidates: number;
  candidates: Array<{
    code: string;
    manufacturer?: string;
    series?: string;
    matchPercentage: number;
    discoveryReason?: string;
    compatibleCount: number;
    differentCount: number;
    unknownOrCheckCount: number;
    compatible: string[];
    different: string[];
    unknownOrCheck: string[];
    warnings: string[];
  }>;
} {
  const normalized = normalizeCode(sourceCode);
  const source = identifyProduct(sourceCode, normalized);
  const discoveries = findEquivalentCandidates(source, sourceCode);

  const reasonByCode = new Map<string, string>();
  for (const discovery of discoveries) {
    const key = discoveryReasonKey(discovery);
    if (key) {
      reasonByCode.set(key, discovery.reason);
    }
  }

  const compared = discoveries
    .map((discovery) => {
      const result = compareProducts(source, discovery.candidate);
      const matchPercentage = calculateMatchPercentage(result).percentage;
      const scored = scoredComparisonsForAudit(result);
      const compatible = scored
        .filter((c) => c.status === 'compatible')
        .map((c) => c.label);
      const different = scored
        .filter((c) => c.status === 'different')
        .map((c) => c.label);
      const unknownOrCheck = scored
        .filter((c) => c.status === 'unknownOrCheck')
        .map((c) => c.label);

      const code = candidateCode(result);
      const reason = reasonByCode.get(normalizeCode(code));

      return {
        code,
        manufacturer: result.candidate.brand,
        series: result.candidate.series,
        matchPercentage,
        discoveryReason: reason,
        compatibleCount: compatible.length,
        differentCount: different.length,
        unknownOrCheckCount: unknownOrCheck.length,
        compatible,
        different,
        unknownOrCheck,
        warnings: result.warnings ?? [],
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return {
    sourceCode,
    totalCandidates: compared.length,
    candidates: compared,
  };
}


import { getPneumaticCodeGenerationCandidates } from './loadPneumaticCylinderCatalogData';
import type {
  PneumaticCodeGenerationCandidate,
  PneumaticCodeGenerationInput,
} from './types';

function padBore3(bore: number): string {
  return String(Math.round(bore)).padStart(3, '0');
}

function padStroke4(stroke: number): string {
  return String(Math.round(stroke)).padStart(4, '0');
}

function applyTemplate(
  template: string,
  input: PneumaticCodeGenerationInput,
  defaultTokens: Record<string, string> = {}
): string {
  const cushioningToken =
    input.cushioningToken ?? defaultTokens.cushioningToken ?? defaultTokens.cushionToken ?? '';

  return template
    .replace(/\{bore_mm\}/g, String(Math.round(input.boreMm)))
    .replace(/\{stroke_mm\}/g, String(Math.round(input.strokeMm)))
    .replace(/\{bore_mm_3_digit\}/g, padBore3(input.boreMm))
    .replace(/\{stroke_mm_4_digit\}/g, padStroke4(input.strokeMm))
    .replace(/\{cushioningToken\}/g, cushioningToken)
    .replace(/\{magnetToken\}/g, defaultTokens.magnetToken ?? 'D')
    .replace(/\{mountingToken\}/g, defaultTokens.mountingToken ?? 'B')
    .replace(/\{cushionToken\}/g, defaultTokens.cushionToken ?? 'C')
    .replace(/\{operationToken\}/g, defaultTokens.operationToken ?? 'DA')
    .replace(/\{headCoverToken\}/g, defaultTokens.headCoverToken ?? 'N');
}

/**
 * Returns catalog-derived code generation candidates (review-required).
 */
export function generatePneumaticCodeCandidates(
  input: PneumaticCodeGenerationInput
): PneumaticCodeGenerationCandidate[] {
  const catalog = getPneumaticCodeGenerationCandidates();
  const brand = input.brand.trim();
  const series = input.series.trim();

  return catalog.templates
    .filter((row) => row.brand === brand && row.series === series)
    .map((row) => ({
      code: applyTemplate(row.template, input, row.defaultTokens ?? {}),
      templateId: `${row.brand}:${row.series}:${row.template}`,
      needsReview: row.needsReview ?? true,
      confidence: (row.confidence as PneumaticCodeGenerationCandidate['confidence']) ?? 'medium',
      notes: row.notes,
    }));
}

export function pickPreferredPneumaticCodeCandidate(
  input: PneumaticCodeGenerationInput,
  options?: { preferAppCurrentShape?: boolean }
): PneumaticCodeGenerationCandidate | null {
  const candidates = generatePneumaticCodeCandidates(input);
  if (candidates.length === 0) {
    return null;
  }

  if (options?.preferAppCurrentShape && input.brand === 'Parker' && input.series === 'P1D') {
    const appCurrent = candidates.find((c) => c.code.includes('P1D-S'));
    if (appCurrent) {
      return appCurrent;
    }
  }

  return candidates[0];
}

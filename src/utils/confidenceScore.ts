import type { ConfidenceLevel } from '@/types/product';

const CONFIDENCE_SCORES: Record<ConfidenceLevel, number> = {
  high: 0.9,
  medium: 0.75,
  low: 0.5,
  unknown: 0,
};

export const LOW_CONFIDENCE_THRESHOLD = 0.65;

export function confidenceToScore(confidence: ConfidenceLevel): number {
  return CONFIDENCE_SCORES[confidence];
}

export function isLowConfidence(confidence: ConfidenceLevel): boolean {
  return confidenceToScore(confidence) < LOW_CONFIDENCE_THRESHOLD;
}

export function formatConfidencePercent(confidence: ConfidenceLevel): string {
  const percent = Math.round(confidenceToScore(confidence) * 100);
  return `%${percent}`;
}

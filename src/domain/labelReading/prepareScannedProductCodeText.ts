import { normalizeCode } from '@/domain/resolver/normalizeCode';

const PRODUCT_CODE_LINE_PATTERN = /[A-Z0-9][A-Z0-9\-/.]{3,}/i;

function isLikelyBrandOnlyLine(line: string): boolean {
  const normalized = normalizeCode(line);
  return normalized.length > 0 && normalized.length <= 12 && !/\d/.test(normalized) && !/[-/]/.test(normalized);
}

function isLikelySerialLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^SN\s*:?/i.test(trimmed)) {
    return true;
  }
  if (/^\*+\d+\*+/.test(trimmed)) {
    return true;
  }
  if (/^GZ\d+[A-Z0-9]*$/i.test(normalizeCode(trimmed))) {
    return true;
  }
  return false;
}

function scoreProductCodeLine(line: string): number {
  const trimmed = line.trim();
  if (!trimmed) {
    return 0;
  }

  if (/^(MODEL|SERI|SERIAL|MADE|SUPPLY)\b/i.test(trimmed) && !PRODUCT_CODE_LINE_PATTERN.test(trimmed)) {
    return -20;
  }

  if (isLikelySerialLine(trimmed)) {
    return -10;
  }

  if (isLikelyBrandOnlyLine(trimmed)) {
    return 1;
  }

  const normalized = normalizeCode(trimmed);
  if (!normalized) {
    return 0;
  }

  let score = normalized.length;
  if (/\d/.test(normalized)) {
    score += 8;
  }
  if (/[-/]/.test(normalized)) {
    score += 6;
  }
  return score;
}

function pickBestLine(lines: string[]): string {
  const candidates = lines
    .map((line) => stripLabelPrefix(line.trim()))
    .filter((line) => line.length > 0);

  if (candidates.length === 0) {
    return '';
  }

  let best = candidates[0];
  let bestScore = scoreProductCodeLine(best);

  for (const line of candidates.slice(1)) {
    const score = scoreProductCodeLine(line);
    if (score > bestScore) {
      best = line;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : candidates[0];
}

function stripLabelPrefix(line: string): string {
  const modelMatch = line.match(/^MODEL\s*:?\s*(.+)$/i);
  if (modelMatch?.[1]) {
    return modelMatch[1].trim();
  }
  return line.trim();
}

/**
 * Collapses OCR output into a single product-code candidate for user review.
 * Does not run identification — only normalizes text shape.
 */
export function prepareScannedProductCodeText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 1) {
    return normalizeCode(stripLabelPrefix(lines[0]));
  }

  const bestLine = pickBestLine(lines);
  if (bestLine && PRODUCT_CODE_LINE_PATTERN.test(bestLine)) {
    return normalizeCode(bestLine);
  }

  const collapsed = lines
    .map((line) => stripLabelPrefix(line.trim()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeCode(collapsed);
}

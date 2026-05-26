import type { ProductSeriesRecord } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

function attr(options: Omit<TechnicalAttribute, 'confidence'> & { confidence?: TechnicalAttribute['confidence'] }): TechnicalAttribute {
  return {
    confidence: 'unknown',
    ...options,
  };
}

function normalizePneumaticCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '-');
}

function extractBoreStroke(normalizedCode: string): { boreMm?: number; strokeMm?: number } {
  // SI50X100
  const xMatch = normalizedCode.match(/(\d{1,3})X(\d{1,4})/i);
  if (xMatch) {
    return { boreMm: Number(xMatch[1]), strokeMm: Number(xMatch[2]) };
  }

  // DSBC-50-100, PRA-50-100, SI-50-100
  const dashMatch = normalizedCode.match(/-(\d{1,3})-(\d{1,4})(?:-|$)/);
  if (dashMatch) {
    return { boreMm: Number(dashMatch[1]), strokeMm: Number(dashMatch[2]) };
  }

  // CQ2B32-50D, C85N25-80 (stroke can have suffix letters)
  const compactMatch = normalizedCode.match(/^[A-Z]+(\d{1,3})-(\d{1,4})[A-Z]*$/);
  if (compactMatch) {
    return { boreMm: Number(compactMatch[1]), strokeMm: Number(compactMatch[2]) };
  }

  // P1D-S050MS-0100 -> S050 => 50, 0100 => 100
  const p1dMatch = normalizedCode.match(/S(\d{2,3})MS-(\d{2,4})/);
  if (p1dMatch) {
    return { boreMm: Number(p1dMatch[1]), strokeMm: Number(p1dMatch[2]) };
  }

  // CP96SDB50-100 or similar -> last "50-100"
  const tailMatch = normalizedCode.match(/(\d{1,3})-(\d{1,4})$/);
  if (tailMatch) {
    return { boreMm: Number(tailMatch[1]), strokeMm: Number(tailMatch[2]) };
  }

  return {};
}

function extractOptionTokens(normalizedCode: string): string[] {
  const tokens = normalizedCode
    .split(/[-/\\\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const optionTokens = new Set<string>();

  // Heuristic: first token is almost always the series prefix (e.g. DSBC, ADN, DSG-01).
  // We avoid treating it as an option token.
  const tokensWithoutPrefix = tokens.slice(1);

  for (const token of tokensWithoutPrefix) {
    if (/^\d+$/.test(token)) {
      continue;
    }
    if (token.length >= 2) {
      optionTokens.add(token);
    }
  }

  // Compact variants like CP96SDB50-100 include SDB inside the prefix chunk.
  if (normalizedCode.includes('SDB')) {
    optionTokens.add('SDB');
  }

  // stroke suffixes like "50D"
  const suffixMatch = normalizedCode.match(/-(\d{1,4})([A-Z]{1,3})$/);
  if (suffixMatch && suffixMatch[2]) {
    optionTokens.add(suffixMatch[2]);
  }

  return [...optionTokens];
}

export function getPneumaticCylinderAttributes(options: {
  inputCode: string;
  series?: ProductSeriesRecord | null;
}): TechnicalAttribute[] {
  const normalized = normalizePneumaticCode(options.inputCode);
  const { boreMm, strokeMm } = extractBoreStroke(normalized);
  const optionTokens = extractOptionTokens(normalized);

  const attributes: TechnicalAttribute[] = [];

  if (options.series) {
    attributes.push(
      attr({
        key: 'series',
        label: 'Seri',
        value: options.series.series,
        evidence: 'series_table',
        confidence: 'medium',
      }),
      attr({
        key: 'standard_family',
        label: 'Standart',
        value: options.series.standardFamily,
        evidence: 'series_table',
        confidence: 'medium',
      })
    );
  }

  attributes.push(
    attr({
      key: 'bore',
      label: 'Çap',
      value: Number.isFinite(boreMm ?? NaN) ? boreMm! : null,
      unit: boreMm !== undefined ? 'mm' : undefined,
      evidence: boreMm !== undefined ? 'code' : 'unknown',
      confidence: boreMm !== undefined ? 'high' : 'unknown',
      note: boreMm === undefined ? 'Koddan net çap (bore) okunamadı.' : undefined,
    }),
    attr({
      key: 'stroke',
      label: 'Strok',
      value: Number.isFinite(strokeMm ?? NaN) ? strokeMm! : null,
      unit: strokeMm !== undefined ? 'mm' : undefined,
      evidence: strokeMm !== undefined ? 'code' : 'unknown',
      confidence: strokeMm !== undefined ? 'high' : 'unknown',
      note: strokeMm === undefined ? 'Koddan net strok (stroke) okunamadı.' : undefined,
    })
  );

  const cushioningToken = optionTokens.find((t) => t === 'PPVA' || t === 'PPSA');
  if (cushioningToken) {
    attributes.push(
      attr({
        key: 'cushioning_token',
        label: 'Sönümleme',
        value: cushioningToken,
        evidence: 'code',
        confidence: 'medium',
        note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.',
      })
    );
  }

  if (optionTokens.length > 0) {
    attributes.push(
      attr({
        key: 'options',
        label: 'Varyant / opsiyonlar',
        value: optionTokens.join(', '),
        evidence: 'code',
        confidence: 'low',
        note: 'Bu bilgiler koddan algılandı. Teknik anlamları seriye göre değişebilir.',
      })
    );
  }

  return attributes;
}


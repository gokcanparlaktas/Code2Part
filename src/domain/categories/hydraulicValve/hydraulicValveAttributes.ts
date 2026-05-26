import type { ProductSeriesRecord } from '@/types/product';
import type { TechnicalAttribute } from '@/types/technicalAttribute';

function attr(options: Omit<TechnicalAttribute, 'confidence'> & { confidence?: TechnicalAttribute['confidence'] }): TechnicalAttribute {
  return {
    confidence: 'unknown',
    ...options,
  };
}

function normalizeHydraulicCode(raw: string): string {
  return raw.trim().toUpperCase();
}

function detectVoltageToken(normalized: string): { value: string; token: string } | null {
  if (/\bEG24\b/.test(normalized) || /EG24N/.test(normalized)) {
    return { value: '24V DC', token: 'EG24' };
  }
  if (/\bCG24\b/.test(normalized) || /CG24N/.test(normalized)) {
    return { value: '24V DC', token: 'CG24' };
  }
  if (/\bD24\b/.test(normalized) || /-D24-/.test(normalized)) {
    return { value: '24V DC', token: 'D24' };
  }
  const dVoltage = normalized.match(/-D(\d{2,3})-/);
  if (dVoltage?.[1]) {
    return { value: `${Number(dVoltage[1])}V DC`, token: `D${dVoltage[1]}` };
  }
  if (/24DC/.test(normalized)) {
    return { value: '24V DC', token: '24DC' };
  }
  return null;
}

function extractConnectorToken(normalized: string): string | null {
  // Connector tokens can be embedded in compact suffixes, e.g. EG24N9K4
  const matches = normalized.match(/([KN]\d{1,2})/g);
  if (!matches || matches.length === 0) {
    return null;
  }
  return matches[matches.length - 1] ?? null;
}

function extractRevisionToken(normalized: string): string | null {
  const rexroth = normalized.match(/-(\d{1,2}X)\b/);
  if (rexroth?.[1]) {
    return rexroth[1];
  }
  const endNumber = normalized.match(/-(\d{2})$/);
  if (endNumber?.[1]) {
    return endNumber[1];
  }
  return null;
}

function extractFunctionToken(normalized: string, series?: ProductSeriesRecord | null): { token: string; confidence: TechnicalAttribute['confidence']; note?: string } | null {
  const rexroth6 = normalized.match(/^4WE6([A-Z])/);
  if (rexroth6 && series?.codePrefix.startsWith('4WE6')) {
    return { token: rexroth6[1], confidence: 'medium', note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.' };
  }
  const rexroth10 = normalized.match(/^4WE10([A-Z])/);
  if (rexroth10 && series?.codePrefix.startsWith('4WE10')) {
    return { token: rexroth10[1], confidence: 'medium', note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.' };
  }
  const yuken = normalized.match(/\b(3C\d{1,2})\b/);
  if (yuken && (series?.series.startsWith('DSG') ?? normalized.startsWith('DSG'))) {
    return { token: yuken[1], confidence: 'medium', note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.' };
  }
  const vickers = normalized.match(/-(\d[A-Z])-?/);
  if (vickers && (series?.series.startsWith('DG4V') ?? normalized.startsWith('DG4V'))) {
    return {
      token: vickers[1],
      confidence: 'low',
      note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.',
    };
  }
  const atos = normalized.match(/\b(DHI|DHU)-(\d{4})\b/);
  if (atos) {
    return { token: atos[2], confidence: 'medium', note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.' };
  }
  const parker = normalized.match(/^D[13]VW(\d{3})/);
  if (parker) {
    return { token: parker[1], confidence: 'low', note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.' };
  }
  return null;
}

export function getHydraulicValveAttributes(options: {
  inputCode: string;
  series?: ProductSeriesRecord | null;
}): TechnicalAttribute[] {
  const normalized = normalizeHydraulicCode(options.inputCode);
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
        key: 'cetop_ng',
        label: 'CETOP / NG',
        value: options.series.cetopNgLabel ?? options.series.standardFamily,
        evidence: 'series_table',
        confidence: 'high',
      })
    );
  }

  const voltage = detectVoltageToken(normalized);
  attributes.push(
    attr({
      key: 'voltage',
      label: 'Bobin voltajı',
      value: voltage ? voltage.value : null,
      evidence: voltage ? 'code' : options.series?.defaultCoilVoltageTr ? 'series_table' : 'unknown',
      confidence: voltage ? 'high' : options.series?.defaultCoilVoltageTr ? 'medium' : 'unknown',
      note: voltage
        ? `Kodda ${voltage.token} geçti.`
        : options.series?.defaultCoilVoltageTr
          ? 'Seri bilgisinde tipik voltaj var; koddan doğrulanmadı.'
          : 'Voltaj koddan çıkarılamadı.',
    })
  );

  const functionToken = extractFunctionToken(normalized, options.series);
  if (functionToken) {
    attributes.push(
      attr({
        key: 'function_token',
        label: 'Fonksiyon / spool',
        value: functionToken.token,
        evidence: 'code',
        confidence: functionToken.confidence,
        note: functionToken.note,
      })
    );
  }

  const connector = extractConnectorToken(normalized);
  if (connector) {
    attributes.push(
      attr({
        key: 'connector_token',
        label: 'Konnektör',
        value: connector,
        evidence: 'code',
        confidence: 'low',
        note: 'Bu bilgi koddan algılandı. Teknik anlamı katalogdan kontrol edilmelidir.',
      })
    );
  }

  const revision = extractRevisionToken(normalized);
  if (revision) {
    attributes.push(
      attr({
        key: 'revision',
        label: 'Revizyon / seri',
        value: revision,
        evidence: 'code',
        confidence: 'medium',
        note: 'Bu bilgi koddan algılandı.',
      })
    );
  }

  return attributes;
}


import type { CatalogPortState } from '@/domain/catalogData/types';

export type CenterTypeParts = {
  primary: string;
  detail: string;
};

export const GENERIC_PORT_STATE_RESOLVED_TR =
  'Port durumu katalog adayından çözümlendi';

const PORT_KEYS = ['P', 'T', 'A', 'B'] as const;

function isPortConnected(state: string | null | undefined): boolean {
  return state != null && state !== 'blocked' && /connected/i.test(state);
}

function isPortBlocked(state: string | null | undefined): boolean {
  return state === 'blocked';
}

/** Markalar arası ortak port özeti: `P,T,A,B Kapalı`, `P-T Bağlı, A,B Kapalı`, … */
export function formatPortStatesCompactLine(
  portState?: CatalogPortState | null
): string | null {
  if (!portState?.P || !portState.T || !portState.A || !portState.B) {
    return null;
  }

  const parts = centerTypePartsFromPortState(portState);
  if (parts) {
    return portCompactLineFromCenterParts(parts);
  }

  return formatPortStatesPerPort(portState);
}

function portCompactLineFromCenterParts(parts: CenterTypeParts): string {
  switch (parts.primary) {
    case 'Kapalı merkez':
      return 'P,T,A,B Kapalı';
    case 'Açık merkez':
      return 'P,T,A,B Açık';
    case 'Tandem merkez':
      return 'P-T Bağlı, A,B Kapalı';
    case 'Yüzer merkez':
      return 'A-B-T Bağlı, P Kapalı';
    case 'Basınç merkez':
      return 'P-A-B Bağlı, T Kapalı';
    case 'A-B merkez':
      return 'A-B Bağlı, P-T Kapalı';
    case 'Ofset merkez':
      return 'P-A Bağlı, B-T Bağlı';
    default:
      return parts.detail;
  }
}

function portLineFromCenterCondition(
  centerCondition: string | null | undefined
): string | null {
  const parts = centerTypePartsFromCondition(centerCondition);
  if (!parts) {
    return null;
  }
  return portCompactLineFromCenterParts(parts);
}

function formatPortStatesPerPort(portState: CatalogPortState): string {
  return PORT_KEYS.map((key) => {
    const state = portState[key];
    if (isPortBlocked(state)) {
      return `${key} Kapalı`;
    }
    if (isPortConnected(state)) {
      return `${key} Bağlı`;
    }
    return `${key} Belirsiz`;
  }).join(', ');
}

/**
 * Ortak merkez tipi metni: port özeti + parantez içinde merkez adı.
 * Örnek: `P,T,A,B Kapalı (Kapalı merkez)`
 */
export function formatUnifiedCenterDisplay(options: {
  portState?: CatalogPortState | null;
  centerConditionValue?: string | null;
}): string | null {
  const parts =
    centerTypePartsFromPortState(options.portState) ??
    centerTypePartsFromCondition(options.centerConditionValue);

  const portLine =
    formatPortStatesCompactLine(options.portState) ??
    portLineFromCenterCondition(options.centerConditionValue);

  if (portLine && parts) {
    return `${portLine} (${parts.primary})`;
  }
  if (parts) {
    return parts.primary;
  }
  if (portLine) {
    return portLine;
  }
  return null;
}

/** @deprecated Prefer formatUnifiedCenterDisplay; kept for callers that pass CenterTypeParts. */
export function formatCenterTypeSummary(parts: CenterTypeParts): string {
  const portLine = portCompactLineFromCenterParts(parts);
  return `${portLine} (${parts.primary})`;
}

/**
 * Sürgü kodu merkez satırında gösterilmez (kod kanıtı ayrı satırda).
 * @deprecated İlk argüman yok sayılır; formatUnifiedCenterDisplay kullanın.
 */
export function formatCenterTypeWithToken(
  _token: string | undefined | null,
  parts: CenterTypeParts,
  portState?: CatalogPortState | null
): string {
  const unified = formatUnifiedCenterDisplay({
    portState,
    centerConditionValue: centerNameToCondition(parts.primary),
  });
  if (unified) {
    return unified;
  }
  return formatCenterTypeSummary(parts);
}

function centerNameToCondition(primary: string): string | null {
  const entry = Object.entries(CENTER_CONDITION_PRIMARY_TR).find(
    ([, label]) => label === primary
  );
  return entry?.[0] ?? null;
}

export function centerTypePartsFromPortState(
  portState?: CatalogPortState | null
): CenterTypeParts | null {
  if (!portState?.P || !portState.T || !portState.A || !portState.B) {
    return null;
  }

  const { P, T, A, B } = portState;

  if (
    isPortBlocked(P) &&
    isPortBlocked(T) &&
    isPortBlocked(A) &&
    isPortBlocked(B)
  ) {
    return { primary: 'Kapalı merkez', detail: 'P,T,A,B Kapalı' };
  }

  if (
    isPortConnected(P) &&
    isPortConnected(T) &&
    isPortConnected(A) &&
    isPortConnected(B)
  ) {
    return { primary: 'Açık merkez', detail: 'P,T,A,B Açık' };
  }

  const tandemCenter =
    isPortConnected(P) &&
    isPortConnected(T) &&
    isPortBlocked(A) &&
    isPortBlocked(B) &&
    (P.includes('T') || T.includes('P'));

  if (tandemCenter) {
    return {
      primary: 'Tandem merkez',
      detail: 'P-T Bağlı, A,B Kapalı',
    };
  }

  const floatCenter =
    isPortBlocked(P) &&
    isPortConnected(A) &&
    isPortConnected(B) &&
    isPortConnected(T) &&
    (A.includes('B') || A.includes('T')) &&
    (B.includes('A') || B.includes('T'));

  if (floatCenter) {
    return {
      primary: 'Yüzer merkez',
      detail: 'A-B-T Bağlı, P Kapalı',
    };
  }

  const pressureCenter =
    isPortConnected(P) &&
    isPortBlocked(T) &&
    isPortConnected(A) &&
    isPortConnected(B) &&
    (P.includes('A') || P.includes('B')) &&
    (A.includes('P') || A.includes('B')) &&
    (B.includes('P') || B.includes('A'));

  if (pressureCenter) {
    return {
      primary: 'Basınç merkez',
      detail: 'P-A-B Bağlı, T Kapalı',
    };
  }

  const abConnectedPtBlocked =
    isPortConnected(A) &&
    isPortConnected(B) &&
    isPortBlocked(P) &&
    isPortBlocked(T) &&
    (A.includes('B') || B.includes('A'));

  if (abConnectedPtBlocked) {
    return {
      primary: 'A-B merkez',
      detail: 'A-B Bağlı, P-T Kapalı',
    };
  }

  const offsetCenter =
    isPortConnected(P) &&
    isPortConnected(A) &&
    isPortConnected(B) &&
    isPortConnected(T) &&
    P.includes('A') &&
    A.includes('P') &&
    B.includes('T') &&
    T.includes('B');

  if (offsetCenter) {
    return {
      primary: 'Ofset merkez',
      detail: 'P-A Bağlı, B-T Bağlı',
    };
  }

  return null;
}

export function portStateBehaviorSummary(
  portState?: CatalogPortState | null
): string | null {
  const unified = formatUnifiedCenterDisplay({ portState });
  if (unified) {
    return unified;
  }
  if (portState?.P && portState.T && portState.A && portState.B) {
    return GENERIC_PORT_STATE_RESOLVED_TR;
  }
  return null;
}

export function isGenericPortStateFallback(summary: string | null | undefined): boolean {
  return summary === GENERIC_PORT_STATE_RESOLVED_TR;
}

const CENTER_CONDITION_PRIMARY_TR: Record<string, string> = {
  closed_center: 'Kapalı merkez',
  open_center: 'Açık merkez',
  tandem_center: 'Tandem merkez',
  float_center: 'Yüzer merkez',
  partially_open: 'Kapalı merkez',
};

const CENTER_CONDITION_DETAIL_TR: Record<string, string> = {
  closed_center: 'P,T,A,B Kapalı',
  open_center: 'P,T,A,B Açık',
  tandem_center: 'P-T Bağlı, A,B Kapalı',
  float_center: 'A-B-T Bağlı, P Kapalı',
  partially_open: 'P,T,A,B Kapalı',
};

export function centerTypePartsFromCondition(
  centerCondition: string | null | undefined
): CenterTypeParts | null {
  if (!centerCondition || centerCondition === 'unknown') {
    return null;
  }
  const primary = CENTER_CONDITION_PRIMARY_TR[centerCondition];
  const detail = CENTER_CONDITION_DETAIL_TR[centerCondition];
  if (!primary || !detail) {
    return null;
  }
  return { primary, detail };
}

export function resolveCenterTypeDisplay(options: {
  portState?: CatalogPortState | null;
  centerConditionValue?: string | null;
  spoolToken?: string | null;
  getCenterConditionDisplay?: (value: string) => string;
  fallback: string;
}): string {
  const unified = formatUnifiedCenterDisplay({
    portState: options.portState,
    centerConditionValue: options.centerConditionValue,
  });
  if (unified) {
    return unified;
  }

  if (
    options.centerConditionValue &&
    options.centerConditionValue !== 'unknown' &&
    options.getCenterConditionDisplay
  ) {
    const label = options.getCenterConditionDisplay(options.centerConditionValue);
    const portLine = portLineFromCenterCondition(options.centerConditionValue);
    if (portLine) {
      return `${portLine} (${label})`;
    }
    return label;
  }

  const generic = portStateBehaviorSummary(options.portState);
  if (generic && !isGenericPortStateFallback(generic)) {
    return generic;
  }

  return options.fallback;
}

/** Vickers/Eaton katalog araması için sürgü tipi (yay harfi olmadan). */
export function catalogSpoolLookupToken(options: {
  rawSpoolSymbol?: string | null;
  rawFunctionCode?: string | null;
  manufacturer?: string | null;
}): string | null {
  const spool = options.rawSpoolSymbol?.trim();
  if (spool) {
    return spool;
  }
  const fn = options.rawFunctionCode?.trim();
  if (!fn) {
    return null;
  }
  const mfr = options.manufacturer?.trim().toLowerCase() ?? '';
  if (mfr.includes('vickers') || mfr.includes('eaton')) {
    const digits = fn.match(/^(\d{1,3})/);
    return digits?.[1] ?? null;
  }
  return fn;
}

import {
  isRexrothWE6BaseSpoolSymbol,
} from './rexrothWE6SpoolSemantics';
import {
  parseRexrothWEDesignSeriesToken,
  type RexrothWEDesignSeriesParse,
} from './rexrothWEDesignSeries';

export type RexrothWESeriesPrefix = '3WE6' | '4WE6' | '4WE10';

export type RexrothParseCompleteness = 'fully_parsed' | 'partial' | 'unknown';

export interface RexrothWEParserDiagnostics {
  parseCompleteness: RexrothParseCompleteness;
  unknownTokens: string[];
  unresolvedSegments: string[];
  parserNotes: string[];
}

export const REXROTH_WE_FULLY_PARSED_NOTE_TR = 'Tam çözümlenmiş katalog kodu';

function isValidRexrothWESpoolToken(spoolToken: string): boolean {
  if (spoolToken === 'DOF') {
    return true;
  }
  if (spoolToken === 'EA' || spoolToken === 'EB') {
    return true;
  }
  if (spoolToken.length === 1 && isRexrothWE6BaseSpoolSymbol(spoolToken)) {
    return true;
  }
  return false;
}

function allowedDesignDigitsForSeries(seriesPrefix: RexrothWESeriesPrefix): string {
  return seriesPrefix === '4WE10' ? '35' : '67';
}

function splitRexrothWESpoolDesignToken(
  token: string,
  allowedDesignFirstDigits: string
):
  | { kind: 'ok'; spoolToken: string; design: RexrothWEDesignSeriesParse }
  | { kind: 'unknown_spool'; token: string }
  | { kind: 'unknown_design'; token: string } {
  const attempts: Array<{ spoolToken: string; designPart: string }> = [];

  if (token.startsWith('DOF')) {
    attempts.push({ spoolToken: 'DOF', designPart: token.slice(3).replace(/^-/, '') });
  }
  if (token.startsWith('EA')) {
    attempts.push({ spoolToken: 'EA', designPart: token.slice(2).replace(/^-/, '') });
  }
  if (token.startsWith('EB')) {
    attempts.push({ spoolToken: 'EB', designPart: token.slice(2).replace(/^-/, '') });
  }
  for (const letter of 'ABCDEGHJY') {
    if (token.startsWith(letter)) {
      attempts.push({ spoolToken: letter, designPart: token.slice(1).replace(/^-/, '') });
    }
  }

  attempts.sort((a, b) => b.spoolToken.length - a.spoolToken.length);

  let lastInvalidDesign: string | null = null;
  for (const attempt of attempts) {
    if (!attempt.designPart) {
      continue;
    }
    const design = parseRexrothWEDesignSeriesToken(
      attempt.designPart,
      allowedDesignFirstDigits
    );
    if (!design) {
      lastInvalidDesign = attempt.designPart;
      continue;
    }
    if (!isValidRexrothWESpoolToken(attempt.spoolToken)) {
      return { kind: 'unknown_spool', token: attempt.spoolToken };
    }
    return { kind: 'ok', spoolToken: attempt.spoolToken, design };
  }

  const numericSuffix = token.match(/(\d{2})$/);
  if (numericSuffix) {
    const designPart = numericSuffix[1];
    const spoolPart = token.slice(0, -2).replace(/-$/, '');
    const design = parseRexrothWEDesignSeriesToken(designPart, allowedDesignFirstDigits);
    if (!design) {
      return { kind: 'unknown_design', token: designPart };
    }
    if (!isValidRexrothWESpoolToken(spoolPart)) {
      return { kind: 'unknown_spool', token: spoolPart || token };
    }
    return { kind: 'ok', spoolToken: spoolPart, design };
  }

  const xSuffix = token.match(/(\dX)$/i);
  if (xSuffix) {
    const designPart = xSuffix[1].toUpperCase();
    const spoolPart = token.slice(0, -2).replace(/-$/, '');
    const design = parseRexrothWEDesignSeriesToken(designPart, allowedDesignFirstDigits);
    if (!design) {
      return { kind: 'unknown_design', token: designPart };
    }
    if (!isValidRexrothWESpoolToken(spoolPart)) {
      return { kind: 'unknown_spool', token: spoolPart || token };
    }
    return { kind: 'ok', spoolToken: spoolPart, design };
  }

  if (lastInvalidDesign) {
    return { kind: 'unknown_design', token: lastInvalidDesign };
  }

  return { kind: 'unknown_spool', token: token };
}

export function analyzePartialRexrothWE(normalized: string): RexrothWEParserDiagnostics {
  const slashIndex = normalized.indexOf('/');
  if (slashIndex === -1) {
    return {
      parseCompleteness: 'unknown',
      unknownTokens: [normalized],
      unresolvedSegments: ['coil_section'],
      parserNotes: [`Kodun şu bölümü çözümlenemedi: ${normalized}`],
    };
  }

  const header = normalized.slice(0, slashIndex);
  const coilSection = normalized.slice(slashIndex + 1);
  const prefixMatch = header.match(/^(3WE6|4WE6|4WE10)(.+)$/);
  if (!prefixMatch) {
    return {
      parseCompleteness: 'unknown',
      unknownTokens: [header],
      unresolvedSegments: ['series_prefix'],
      parserNotes: [`Kodun şu bölümü çözümlenemedi: ${header}`],
    };
  }

  const seriesPrefix = prefixMatch[1] as RexrothWESeriesPrefix;
  const spoolDesignToken = prefixMatch[2];
  const split = splitRexrothWESpoolDesignToken(
    spoolDesignToken,
    allowedDesignDigitsForSeries(seriesPrefix)
  );

  if (split.kind === 'unknown_spool') {
    return {
      parseCompleteness: 'partial',
      unknownTokens: [split.token],
      unresolvedSegments: ['spool_symbol'],
      parserNotes: [`Sürgü sembolü tanınamadı: ${split.token}`],
    };
  }

  if (split.kind === 'unknown_design') {
    return {
      parseCompleteness: 'partial',
      unknownTokens: [split.token],
      unresolvedSegments: ['design_series'],
      parserNotes: [`Tasarım serisi tanınamadı: ${split.token}`],
    };
  }

  if (!coilSection) {
    return {
      parseCompleteness: 'partial',
      unknownTokens: [''],
      unresolvedSegments: ['coil_section'],
      parserNotes: ['Bobin bölümü çözümlenemedi'],
    };
  }

  return {
    parseCompleteness: 'partial',
    unknownTokens: [coilSection],
    unresolvedSegments: ['coil_section'],
    parserNotes: [`Bobin bölümü çözümlenemedi: ${coilSection}`],
  };
}

export function buildRexrothWEUserFacingParserMessages(
  diagnostics: RexrothWEParserDiagnostics
): string[] {
  const messages = new Set<string>(diagnostics.parserNotes);

  for (const token of diagnostics.unknownTokens) {
    if (!token) {
      continue;
    }
    if (diagnostics.unresolvedSegments.includes('spool_symbol')) {
      messages.add(`Sürgü sembolü tanınamadı: ${token}`);
    } else if (diagnostics.unresolvedSegments.includes('design_series')) {
      messages.add(`Tasarım serisi tanınamadı: ${token}`);
    } else if (diagnostics.unresolvedSegments.includes('coil_section')) {
      messages.add(`Bobin bölümü çözümlenemedi: ${token}`);
    } else {
      messages.add(`Kodun şu bölümü çözümlenemedi: ${token}`);
    }
  }

  return [...messages];
}

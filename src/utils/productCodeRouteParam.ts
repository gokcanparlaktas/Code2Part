/**
 * Product codes often contain "/" (e.g. Rexroth 4WE6E-7X/HG24N9K4).
 * Encode when building routes so the slash is not treated as a path segment.
 */
export function encodeProductCodeForRoute(code: string): string {
  return encodeURIComponent(code.trim());
}

export function decodeProductCodeFromRoute(
  param: string | string[] | undefined
): string {
  const raw = (Array.isArray(param) ? param[0] : param)?.trim() ?? '';
  if (!raw) {
    return '';
  }

  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
  } catch {
    return raw;
  }
}

export function productCodeResultHref(code: string): `/result?code=${string}` {
  return `/result?code=${encodeProductCodeForRoute(code)}`;
}

export function productCodeEquivalentsHref(code: string): `/equivalents?code=${string}` {
  return `/equivalents?code=${encodeProductCodeForRoute(code)}`;
}

/**
 * Rexroth nameplates encode component series as two digits (e.g. J62, B61).
 * Ordering codes use 6X / 7X where X is a decade placeholder (60–69, 70–79),
 * not a literal letter on the nameplate.
 */

const WE6_NAMEPLATE_HEADER =
  /^(3WE6|4WE6)(E[AB]|DOF|E|[ABCDGHJY])([67])(\d)\/(.+)$/;

const WE10_NAMEPLATE_HEADER =
  /^(4WE10)(E[AB]|DOF|E|[ABCDGHJY])([35])(\d)\/(.+)$/;

/** Convert nameplate component series digits to ordering 6X/7X/3X/5X before `/`. */
export function normalizeRexrothWEComponentSeriesFromNameplate(normalized: string): string {
  const we6 = WE6_NAMEPLATE_HEADER.exec(normalized);
  if (we6) {
    return `${we6[1]}${we6[2]}-${we6[3]}X/${we6[5]}`;
  }

  const we10 = WE10_NAMEPLATE_HEADER.exec(normalized);
  if (we10) {
    return `${we10[1]}${we10[2]}-${we10[3]}X/${we10[5]}`;
  }

  return normalized;
}

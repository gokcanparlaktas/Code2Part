/**
 * Backward-compatible entry points for Rexroth 4WE6 parsing.
 * Implementation lives in parseRexrothWE.ts (3WE6 / 4WE6 / 4WE10).
 */

export {
  isRexrothWE6Code,
  parseRexrothWE6,
  parseRexrothWE6ProductCode,
  type RexrothWE6CodeFormat,
  type RexrothWE6ParsedCode,
} from './parseRexrothWE';

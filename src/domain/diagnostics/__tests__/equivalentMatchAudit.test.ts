import { buildEquivalentMatchAudit } from '../equivalentMatchAudit';

describe('buildEquivalentMatchAudit', () => {
  it.each(['DG4V-3-2A-M-U-H7-60', 'DSBC-50-100-PPVA-N3'])(
    'builds an audit report for %s',
    (code) => {
      const audit = buildEquivalentMatchAudit(code);
      expect(audit.sourceCode).toBe(code);
      expect(audit.totalCandidates).toBeGreaterThan(0);
      expect(audit.candidates.length).toBe(audit.totalCandidates);

      // Sorted by matchPercentage desc
      for (let i = 1; i < audit.candidates.length; i += 1) {
        expect(audit.candidates[i - 1]!.matchPercentage).toBeGreaterThanOrEqual(
          audit.candidates[i]!.matchPercentage,
        );
      }

      for (const candidate of audit.candidates) {
        expect(candidate.code.length).toBeGreaterThan(0);
        expect(candidate.compatibleCount).toBe(candidate.compatible.length);
        expect(candidate.differentCount).toBe(candidate.different.length);
        expect(candidate.unknownOrCheckCount).toBe(candidate.unknownOrCheck.length);

        // discoveryReason should exist for compared candidates (from discovery pool)
        expect(candidate.discoveryReason).toBeDefined();

        if (candidate.unknownOrCheckCount > 0) {
          expect(candidate.matchPercentage).not.toBe(100);
        }
        if (candidate.warnings.length > 0) {
          expect(candidate.matchPercentage).not.toBe(100);
        }
      }
    },
  );
});


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

describe('equivalentMatchAudit coil voltage regression', () => {
  it('DG4V-3 vs Rexroth EG24 does not list Bobin voltajı as unknownOrCheck', () => {
    const audit = buildEquivalentMatchAudit('DG4V-3-2A-M-U-H7-60');
    const first = audit.candidates[0]!;
    expect(first.code).toBe('4WE6E-6X/EG24N9K4');
    expect(first.compatible).toContain('Bobin voltajı');
    expect(first.unknownOrCheck).not.toContain('Bobin voltajı');
  });
});


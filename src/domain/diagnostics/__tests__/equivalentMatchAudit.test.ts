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
    const rexroth = audit.candidates.find((c) => c.code === '4WE6E-6X/EG24N9K4');
    expect(rexroth).toBeDefined();
    expect(rexroth!.compatible).toContain('Bobin voltajı');
    expect(rexroth!.unknownOrCheck).not.toContain('Bobin voltajı');
  });

  it('4WE6F-62 suggests Yuken with match above 58%', () => {
    const audit = buildEquivalentMatchAudit('4WE6F-62/EG24N9K4');
    const yukenCandidates = audit.candidates.filter((c) => c.code.startsWith('DSG-01'));
    expect(yukenCandidates.length).toBeGreaterThan(0);
    expect(yukenCandidates.some((c) => c.matchPercentage > 58)).toBe(true);
    expect(yukenCandidates.some((c) => c.code.includes('3C9'))).toBe(true);
    expect(audit.candidates.some((c) => c.code.includes('3WE'))).toBe(false);
  });

  it('DG4V-3-2A-M-U-D24-60 suggests Rexroth/Yuken with match above 58% and no 3WE6', () => {
    const audit = buildEquivalentMatchAudit('DG4V-3-2A-M-U-D24-60');
    expect(audit.candidates.some((c) => c.code.includes('3WE'))).toBe(false);

    const rexroth = audit.candidates.find((c) => c.code === '4WE6E-62/EG24N9K4');
    const yuken = audit.candidates.find((c) => c.code === 'DSG-01-3C2-D24-N1-70');
    expect(rexroth).toBeDefined();
    expect(yuken).toBeDefined();
    expect(rexroth!.matchPercentage).toBeGreaterThan(58);
    expect(yuken!.matchPercentage).toBeGreaterThan(58);
  });
});


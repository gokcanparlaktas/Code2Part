import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
} from '@/types/category';
import {
  CATALOG_CHECK_DISPLAY_MESSAGE,
  UNKNOWN_CANONICAL_KEY,
} from '@/types/canonicalAttribute';

import {
  getCanonicalDisplayValueForUi,
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '../resolveCanonicalAttribute';

describe('resolveCanonicalAttribute', () => {
  describe('coil_rating → coil_voltage (DC_24V)', () => {
    it('maps Rexroth G24 to DC_24V', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: 'Rexroth',
        series: '4WE6',
        attributeKey: 'coil_rating',
        rawToken: 'G24',
      });
      expect(resolved.resolved).toBe(true);
      expect(resolved.rawAttributeKey).toBe('coil_rating');
      expect(resolved.attributeKey).toBe('coil_voltage');
      expect(resolved.canonicalKey).toBe('DC_24V');
      expect(resolved.canonicalValue).toBe('DC_24V');
      expect(resolved.displayValue).toBe('24V DC');
      expect(resolved.rawTokenLabel).toBe('Kod kanıtı: G24');
    });

    it('maps Yuken D24 to DC_24V', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: 'Yuken',
        series: 'DSG-01',
        attributeKey: 'coil_rating',
        rawToken: 'D24',
      });
      expect(resolved.canonicalKey).toBe('DC_24V');
      expect(resolved.displayValue).toBe('24V DC');
    });

    it('maps Atos 24DC to DC_24V', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: 'Atos',
        series: 'DHI',
        attributeKey: 'coil_rating',
        rawToken: '24DC',
      });
      expect(resolved.canonicalKey).toBe('DC_24V');
    });

    it('maps Vickers H to DC_24V with catalog check', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: 'Vickers',
        series: 'DG4V-3',
        attributeKey: 'coil_rating',
        rawToken: 'H',
      });
      expect(resolved.canonicalKey).toBe('DC_24V');
      expect(resolved.displayValue).toBe('24V DC');
      expect(resolved.requiresCatalogCheck).toBe(true);
    });

    it('G24 and D24 resolve to the same canonicalKey for comparison', () => {
      const g24 = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'G24',
      });
      const d24 = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'D24',
      });
      expect(g24.canonicalKey).toBe(d24.canonicalKey);
      expect(g24.canonicalKey).toBe('DC_24V');
    });
  });

  describe('cushioning_type', () => {
    it('maps PPVA to ADJUSTABLE_PNEUMATIC_CUSHIONING', () => {
      const resolved = resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        manufacturer: 'Festo',
        series: 'DSBC',
        attributeKey: 'cushioning_type',
        rawToken: 'PPVA',
      });
      expect(resolved.canonicalKey).toBe('ADJUSTABLE_PNEUMATIC_CUSHIONING');
      expect(resolved.displayValue).toBe('Ayarlanabilir pnömatik sönümleme');
    });

    it('maps PPV to the same canonicalKey as PPVA', () => {
      const ppva = resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'cushioning_type',
        rawToken: 'PPVA',
      });
      const ppv = resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'cushioning_type',
        rawToken: 'PPV',
      });
      expect(ppva.canonicalKey).toBe(ppv.canonicalKey);
    });
  });

  describe('Festo DSBC variant_code N3', () => {
    it('maps N3 to ISO_15552 only in Festo DSBC context', () => {
      const resolved = resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        manufacturer: 'Festo',
        series: 'DSBC',
        attributeKey: 'variant_code',
        rawToken: 'N3',
      });
      expect(resolved.canonicalKey).toBe('ISO_15552');
      expect(resolved.displayValue).toBe('ISO 15552');
      expect(resolved.rawTokenLabel).toBe('Kod kanıtı: N3');
    });

    it('does not map N3 outside Festo DSBC context', () => {
      const resolved = resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        manufacturer: 'SMC',
        series: 'CP96',
        attributeKey: 'variant_code',
        rawToken: 'N3',
      });
      expect(resolved.resolved).toBe(false);
      expect(resolved.canonicalKey).toBe(UNKNOWN_CANONICAL_KEY);
    });
  });

  describe('unknown handling', () => {
    it('returns unknown canonicalKey for unmapped tokens', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'ZZZ',
      });
      expect(resolved.resolved).toBe(false);
      expect(resolved.canonicalKey).toBe(UNKNOWN_CANONICAL_KEY);
      expect(resolved.canonicalValue).toBeNull();
      expect(resolved.displayValue).toBe('');
    });

    it('does not use catalog-check message as canonical displayValue', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'ZZZ',
      });
      expect(resolved.displayValue).not.toBe(CATALOG_CHECK_DISPLAY_MESSAGE);
      expect(getCanonicalDisplayValueForUi(resolved)).toBe(CATALOG_CHECK_DISPLAY_MESSAGE);
    });

    it('isUnknownCanonical identifies unresolved fields', () => {
      const resolved = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'ZZZ',
      });
      expect(isUnknownCanonical(resolved)).toBe(true);
    });

    it('two unknown fields share unknown canonicalKey (must not compare as equal meaning)', () => {
      const a = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'ZZZ',
      });
      const b = resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'YYY',
      });
      expect(a.canonicalKey).toBe(UNKNOWN_CANONICAL_KEY);
      expect(b.canonicalKey).toBe(UNKNOWN_CANONICAL_KEY);
      expect(a.canonicalValue).toBeNull();
      expect(b.canonicalValue).toBeNull();
    });
  });
});

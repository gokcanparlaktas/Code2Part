import { compareConnectorCanonicalSnapshots, connectorSnapshotFromResolved } from '@/domain/canonical/connector/compareConnectorCanonical';
import { formatConnectorDisplayValue } from '@/domain/canonical/connector/formatConnectorDisplayValue';
import { resolveCanonicalAttribute } from '@/domain/canonical/resolveCanonicalAttribute';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { compareHydraulicValveCanonicalProfiles } from '@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { buildCanonicalCoverageDiagnostics } from '@/domain/diagnostics/canonicalCoverageDiagnostics';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

function resolveConnector(
  rawToken: string,
  manufacturer?: string,
  series?: string,
) {
  return resolveCanonicalAttribute({
    category: HYDRAULIC_VALVE_CATEGORY,
    manufacturer,
    series,
    attributeKey: 'connector_type',
    rawToken,
  });
}

function buildProfile(code: string) {
  const id = identifyProduct(code, normalizeCode(code));
  return buildHydraulicValveCanonicalProfile({
    identification: id,
    attributes: getTechnicalAttributes(id),
  });
}

describe('connector canonical resolver', () => {
  it('Rexroth K4 resolves to DIN_VALVE_CONNECTOR family', () => {
    const resolved = resolveConnector('K4', 'Rexroth', '4WE6');
    expect(resolved.canonicalKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.connectorFamilyKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.displayValue).toContain('DIN valf soketi');
  });

  it('Vickers DG4V-3 U resolves to DIN_VALVE_CONNECTOR', () => {
    const resolved = resolveConnector('U', 'Vickers', 'DG4V-3');
    expect(resolved.canonicalKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.connectorFamilyKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.displayValue).toContain('DIN valf soketi');
  });

  it('Vickers DG4V-5 U resolves to DIN_VALVE_CONNECTOR via seriesFamily', () => {
    const resolved = resolveConnector('U', 'Vickers', 'DG4V-5');
    expect(resolved.canonicalKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.connectorFamilyKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.requiresCatalogCheck).toBe(false);
  });

  it('Vickers U6 shares DIN_VALVE_CONNECTOR with indicator light detail', () => {
    const resolved = resolveConnector('U6', 'Vickers', 'DG4V-3');
    expect(resolved.canonicalKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.hasIndicatorLight).toBe(true);
    expect(resolved.connectorOptions).toContain('INDICATOR_LIGHT');
    expect(formatConnectorDisplayValue(resolved)).toContain('Işıklı');
  });

  it('Vickers U1 shares DIN_VALVE_CONNECTOR with PG11 detail', () => {
    const resolved = resolveConnector('U1', 'Vickers', 'DG4V-3');
    expect(resolved.canonicalKey).toBe('DIN_VALVE_CONNECTOR');
    expect(resolved.hasPgPlug).toBe(true);
    expect(resolved.connectorOptions).toContain('PG11_ENTRY');
    expect(formatConnectorDisplayValue(resolved)).toContain('PG11 girişli');
  });

  it('Yuken N and N1 share PLUG_IN_CONNECTOR; N1 has light detail only', () => {
    const n = resolveConnector('N', 'Yuken', 'DSG-01');
    const n1 = resolveConnector('N1', 'Yuken', 'DSG-01');
    expect(n.canonicalKey).toBe('PLUG_IN_CONNECTOR');
    expect(n1.canonicalKey).toBe('PLUG_IN_CONNECTOR');
    expect(n1.hasIndicatorLight).toBe(true);
    expect(n.isGenericConnector).toBe(true);
  });

  it('Vickers KUP4 resolves to AMP_JUNIOR_TIMER', () => {
    const resolved = resolveConnector('KUP4', 'Vickers', 'DG4V-3');
    expect(resolved.canonicalKey).toBe('AMP_JUNIOR_TIMER');
    expect(resolved.connectorFamilyKey).toBe('AMP_JUNIOR_TIMER');
  });

  it('Vickers KUP5 resolves to DEUTSCH_CONNECTOR', () => {
    const resolved = resolveConnector('KUP5', 'Vickers', 'DG4V-3');
    expect(resolved.canonicalKey).toBe('DEUTSCH_CONNECTOR');
  });

  it('Vickers KUPM4L resolves to M12_4_PIN with pinCount 4', () => {
    const resolved = resolveConnector('KUPM4L', 'Vickers', 'DG4V-3');
    expect(resolved.canonicalKey).toBe('M12_4_PIN');
    expect(resolved.pinCount).toBe(4);
    expect(resolved.connectorFamilyKey).toBe('M12_CONNECTOR');
  });
});

describe('connector canonical comparison', () => {
  it('Vickers U vs U6 is compatible with option warning, not different', () => {
    const u = connectorSnapshotFromResolved(resolveConnector('U', 'Vickers', 'DG4V-3'));
    const u6 = connectorSnapshotFromResolved(resolveConnector('U6', 'Vickers', 'DG4V-3'));
    const result = compareConnectorCanonicalSnapshots(u, u6);
    expect(result.comparison.status).toBe('compatible');
    expect(result.comparison.status).not.toBe('different');
    expect(result.warning).toContain('ışık');
  });

  it('Vickers U vs U1 is compatible with PG11 detail warning', () => {
    const u = connectorSnapshotFromResolved(resolveConnector('U', 'Vickers', 'DG4V-3'));
    const u1 = connectorSnapshotFromResolved(resolveConnector('U1', 'Vickers', 'DG4V-3'));
    const result = compareConnectorCanonicalSnapshots(u, u1);
    expect(result.comparison.status).toBe('compatible');
    expect(result.warning).toMatch(/PG11|opsiyon/i);
  });

  it('Rexroth K4 vs Vickers U is same family check, not different', () => {
    const k4 = connectorSnapshotFromResolved(resolveConnector('K4', 'Rexroth', '4WE6'));
    const u = connectorSnapshotFromResolved(resolveConnector('U', 'Vickers', 'DG4V-3'));
    const result = compareConnectorCanonicalSnapshots(k4, u);
    expect(result.comparison.status).not.toBe('different');
    expect(['compatible', 'unknownOrCheck']).toContain(result.comparison.status);
  });

  it('Vickers U vs KUP4 is different connector family', () => {
    const u = connectorSnapshotFromResolved(resolveConnector('U', 'Vickers', 'DG4V-3'));
    const kup4 = connectorSnapshotFromResolved(resolveConnector('KUP4', 'Vickers', 'DG4V-3'));
    const result = compareConnectorCanonicalSnapshots(u, kup4);
    expect(result.comparison.status).toBe('different');
  });

  it('Yuken N vs N1 is compatible with light option detail', () => {
    const n = connectorSnapshotFromResolved(resolveConnector('N', 'Yuken', 'DSG-01'));
    const n1 = connectorSnapshotFromResolved(resolveConnector('N1', 'Yuken', 'DSG-01'));
    const result = compareConnectorCanonicalSnapshots(n, n1);
    expect(result.comparison.status).toBe('compatible');
    expect(result.comparison.status).not.toBe('different');
  });
});

describe('connector canonical diagnostics', () => {
  it('all catalog connector_type tokens resolve (no missing mappings)', () => {
    const report = buildCanonicalCoverageDiagnostics();
    const connectorMissing = report.missingMappings.filter(
      (entry) => entry.attributeKey === 'connector_type',
    );
    expect(connectorMissing).toHaveLength(0);
    expect(
      report.topMissingAttributeKeys.find((entry) => entry.attributeKey === 'connector_type')?.count ?? 0,
    ).toBe(0);
  });
});

describe('connector canonical UI', () => {
  it('main UI shows translated connector without raw tokens or Kod kanıtı', () => {
    const id = identifyProduct('4WE6E-7X/HG24N9K4', normalizeCode('4WE6E-7X/HG24N9K4'));
    const rows = buildProductDetailRows(id);
    const connector = rows.find((r) => r.label === 'Konnektör tipi');
    expect(connector?.value).toContain('DIN valf soketi');
    expect(connector?.value).not.toContain('K4');
    expect(connector?.value).not.toContain('Kod kanıtı');
  });

});

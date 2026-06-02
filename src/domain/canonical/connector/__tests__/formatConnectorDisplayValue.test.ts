import {
  DIN_VALVE_CONNECTOR_SHORT_LABEL,
  formatConnectorUiLabel,
  shortenConnectorCatalogText,
} from '@/domain/canonical/connector/formatConnectorDisplayValue';

describe('shortenConnectorCatalogText', () => {
  it('shortens Rexroth 175301-803 catalog sentence', () => {
    expect(
      shortenConnectorCatalogText(
        'Connector 3 Pole (2+PE) according to DIN EN 175301-803'
      )
    ).toBe('EN 175301-803');
  });

  it('shortens Vickers ISO 4400 / DIN 43650 text', () => {
    expect(shortenConnectorCatalogText('ISO 4400, DIN 43650')).toBe('DIN 43650');
  });
});

describe('formatConnectorUiLabel', () => {
  it('uses short DIN label for DIN valve connector family', () => {
    expect(
      formatConnectorUiLabel({
        connectorFamilyKey: 'DIN_VALVE_CONNECTOR',
      })
    ).toBe(DIN_VALVE_CONNECTOR_SHORT_LABEL);
  });

  it('appends option detail for U6', () => {
    expect(
      formatConnectorUiLabel({
        connectorFamilyKey: 'DIN_VALVE_CONNECTOR',
        displayDetail: 'Işıklı',
      })
    ).toBe(`${DIN_VALVE_CONNECTOR_SHORT_LABEL} (Işıklı)`);
  });
});

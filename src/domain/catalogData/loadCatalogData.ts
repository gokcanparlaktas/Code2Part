/**
 * Read-only loaders for data/catalog-data JSON (source of truth).
 * Do not mutate returned objects.
 */

import rexrothConnectorVoltage from '@catalog-data/rexroth/directional-controls/we/connector-voltage-candidates.json';
import rexrothMounting from '@catalog-data/rexroth/directional-controls/shared/mounting-surface-candidates.json';
import rexrothSpool from '@catalog-data/rexroth/directional-controls/shared/spool-symbol-candidates.json';
import yukenDsgConnectorVoltage from '@catalog-data/yuken/directional-controls/dsg/connector-voltage-candidates.json';
import yukenDshgConnectorVoltage from '@catalog-data/yuken/directional-controls/dshg/connector-voltage-candidates.json';
import rexrothTechnicalData from '@catalog-data/rexroth/directional-controls/we/technical-data-candidates.json';
import yukenDsgTechnicalData from '@catalog-data/yuken/directional-controls/dsg/technical-data-candidates.json';
import yukenDshgParserSpec from '@catalog-data/yuken/directional-controls/dshg/parser-spec-candidate.json';
import yukenMounting from '@catalog-data/yuken/directional-controls/shared/mounting-surface-candidates.json';
import yukenSpool from '@catalog-data/yuken/directional-controls/shared/spool-symbol-candidates.json';
import eatonDg4vConnectorVoltage from '@catalog-data/eaton/directional-controls/dg4v/connector-voltage-candidates.json';
import eatonDg4vTechnicalData from '@catalog-data/eaton/directional-controls/dg4v/technical-data-candidates.json';
import eatonMounting from '@catalog-data/eaton/directional-controls/shared/mounting-surface-candidates.json';
import eatonSpool from '@catalog-data/eaton/directional-controls/shared/spool-symbol-candidates.json';

export type RexrothSpoolCatalog = typeof rexrothSpool;
export type YukenSpoolCatalog = typeof yukenSpool;
export type RexrothMountingCatalog = typeof rexrothMounting;
export type YukenMountingCatalog = typeof yukenMounting;
export type RexrothConnectorVoltageCatalog = typeof rexrothConnectorVoltage;
export type YukenDsgConnectorVoltageCatalog = typeof yukenDsgConnectorVoltage;
export type YukenDshgConnectorVoltageCatalog = typeof yukenDshgConnectorVoltage;
export type YukenDshgParserSpecCatalog = typeof yukenDshgParserSpec;
export type RexrothTechnicalDataCatalog = typeof rexrothTechnicalData;
export type YukenDsgTechnicalDataCatalog = typeof yukenDsgTechnicalData;
export type EatonSpoolCatalog = typeof eatonSpool;
export type EatonMountingCatalog = typeof eatonMounting;
export type EatonDg4vConnectorVoltageCatalog = typeof eatonDg4vConnectorVoltage;
export type EatonDg4vTechnicalDataCatalog = typeof eatonDg4vTechnicalData;

export function getRexrothSpoolCatalog(): RexrothSpoolCatalog {
  return rexrothSpool;
}

export function getYukenSpoolCatalog(): YukenSpoolCatalog {
  return yukenSpool;
}

export function getRexrothMountingCatalog(): RexrothMountingCatalog {
  return rexrothMounting;
}

export function getYukenMountingCatalog(): YukenMountingCatalog {
  return yukenMounting;
}

export function getRexrothConnectorVoltageCatalog(): RexrothConnectorVoltageCatalog {
  return rexrothConnectorVoltage;
}

export function getYukenDsgConnectorVoltageCatalog(): YukenDsgConnectorVoltageCatalog {
  return yukenDsgConnectorVoltage;
}

export function getYukenDshgConnectorVoltageCatalog(): YukenDshgConnectorVoltageCatalog {
  return yukenDshgConnectorVoltage;
}

/** Catalog prep spec only — no runtime DSHG parser in Phase A. */
export function getYukenDshgParserSpecCatalog(): YukenDshgParserSpecCatalog {
  return yukenDshgParserSpec;
}

export function getRexrothTechnicalDataCatalog(): RexrothTechnicalDataCatalog {
  return rexrothTechnicalData;
}

export function getYukenDsgTechnicalDataCatalog(): YukenDsgTechnicalDataCatalog {
  return yukenDsgTechnicalData;
}

export function getEatonSpoolCatalog(): EatonSpoolCatalog {
  return eatonSpool;
}

export function getEatonMountingCatalog(): EatonMountingCatalog {
  return eatonMounting;
}

export function getEatonDg4vConnectorVoltageCatalog(): EatonDg4vConnectorVoltageCatalog {
  return eatonDg4vConnectorVoltage;
}

export function getEatonDg4vTechnicalDataCatalog(): EatonDg4vTechnicalDataCatalog {
  return eatonDg4vTechnicalData;
}

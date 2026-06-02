import {
  getRexrothConnectorVoltageCatalog,
  getRexrothMountingCatalog,
  getRexrothSpoolCatalog,
  getRexrothTechnicalDataCatalog,
  getYukenDsgConnectorVoltageCatalog,
  getYukenDsgTechnicalDataCatalog,
  getYukenDshgConnectorVoltageCatalog,
  getYukenDshgParserSpecCatalog,
  getYukenMountingCatalog,
  getYukenSpoolCatalog,
  getEatonDg4vConnectorVoltageCatalog,
  getEatonDg4vTechnicalDataCatalog,
  getEatonMountingCatalog,
  getEatonSpoolCatalog,
  type RexrothConnectorVoltageCatalog,
  type RexrothMountingCatalog,
  type RexrothSpoolCatalog,
  type RexrothTechnicalDataCatalog,
  type YukenDsgConnectorVoltageCatalog,
  type YukenDsgTechnicalDataCatalog,
  type YukenDshgConnectorVoltageCatalog,
  type YukenDshgParserSpecCatalog,
  type YukenMountingCatalog,
  type YukenSpoolCatalog,
  type EatonDg4vConnectorVoltageCatalog,
  type EatonDg4vTechnicalDataCatalog,
  type EatonMountingCatalog,
  type EatonSpoolCatalog,
} from '@/domain/catalogData/loadCatalogData';

export interface CatalogDataProvider {
  getRexrothSpoolCatalog(): RexrothSpoolCatalog;
  getYukenSpoolCatalog(): YukenSpoolCatalog;
  getRexrothMountingCatalog(): RexrothMountingCatalog;
  getYukenMountingCatalog(): YukenMountingCatalog;
  getRexrothConnectorVoltageCatalog(): RexrothConnectorVoltageCatalog;
  getYukenDsgConnectorVoltageCatalog(): YukenDsgConnectorVoltageCatalog;
  getYukenDshgConnectorVoltageCatalog(): YukenDshgConnectorVoltageCatalog;
  getYukenDshgParserSpecCatalog(): YukenDshgParserSpecCatalog;
  getRexrothTechnicalDataCatalog(): RexrothTechnicalDataCatalog;
  getYukenDsgTechnicalDataCatalog(): YukenDsgTechnicalDataCatalog;
  getEatonSpoolCatalog(): EatonSpoolCatalog;
  getEatonMountingCatalog(): EatonMountingCatalog;
  getEatonDg4vConnectorVoltageCatalog(): EatonDg4vConnectorVoltageCatalog;
  getEatonDg4vTechnicalDataCatalog(): EatonDg4vTechnicalDataCatalog;
  initialize?(): Promise<void>;
  catalogVersion?: string;
}

export class LocalCatalogDataProvider implements CatalogDataProvider {
  getRexrothSpoolCatalog(): RexrothSpoolCatalog {
    return getRexrothSpoolCatalog();
  }

  getYukenSpoolCatalog(): YukenSpoolCatalog {
    return getYukenSpoolCatalog();
  }

  getRexrothMountingCatalog(): RexrothMountingCatalog {
    return getRexrothMountingCatalog();
  }

  getYukenMountingCatalog(): YukenMountingCatalog {
    return getYukenMountingCatalog();
  }

  getRexrothConnectorVoltageCatalog(): RexrothConnectorVoltageCatalog {
    return getRexrothConnectorVoltageCatalog();
  }

  getYukenDsgConnectorVoltageCatalog(): YukenDsgConnectorVoltageCatalog {
    return getYukenDsgConnectorVoltageCatalog();
  }

  getYukenDshgConnectorVoltageCatalog(): YukenDshgConnectorVoltageCatalog {
    return getYukenDshgConnectorVoltageCatalog();
  }

  getYukenDshgParserSpecCatalog(): YukenDshgParserSpecCatalog {
    return getYukenDshgParserSpecCatalog();
  }

  getRexrothTechnicalDataCatalog(): RexrothTechnicalDataCatalog {
    return getRexrothTechnicalDataCatalog();
  }

  getYukenDsgTechnicalDataCatalog(): YukenDsgTechnicalDataCatalog {
    return getYukenDsgTechnicalDataCatalog();
  }

  getEatonSpoolCatalog(): EatonSpoolCatalog {
    return getEatonSpoolCatalog();
  }

  getEatonMountingCatalog(): EatonMountingCatalog {
    return getEatonMountingCatalog();
  }

  getEatonDg4vConnectorVoltageCatalog(): EatonDg4vConnectorVoltageCatalog {
    return getEatonDg4vConnectorVoltageCatalog();
  }

  getEatonDg4vTechnicalDataCatalog(): EatonDg4vTechnicalDataCatalog {
    return getEatonDg4vTechnicalDataCatalog();
  }
}

const defaultLocalCatalogDataProvider = new LocalCatalogDataProvider();

export function getDefaultCatalogDataProvider(): CatalogDataProvider {
  return defaultLocalCatalogDataProvider;
}

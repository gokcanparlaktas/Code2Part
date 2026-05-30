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
}

const defaultLocalCatalogDataProvider = new LocalCatalogDataProvider();

export function getDefaultCatalogDataProvider(): CatalogDataProvider {
  return defaultLocalCatalogDataProvider;
}

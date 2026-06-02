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
import {
  getRollingBearingBrandDetectionCatalog,
  getRollingBearingBoreCodeCatalog,
  getRollingBearingDimensionCatalog,
  getRollingBearingFamilyIndexCatalog,
  getRollingBearingGenerationSpecCatalog,
  getRollingBearingManufacturerIndexCatalog,
  getRollingBearingMappingCatalog,
  getRollingBearingParserSpecCatalog,
  getRollingBearingSeriesCatalog,
  getRollingBearingSuffixCatalog,
  getRollingBearingUnknownOrReviewCatalog,
  type RollingBearingBrandDetectionCatalog,
  type RollingBearingBoreCodeCatalog,
  type RollingBearingDimensionCatalog,
  type RollingBearingFamilyIndexCatalog,
  type RollingBearingGenerationSpecCatalog,
  type RollingBearingManufacturerIndexCatalog,
  type RollingBearingMappingCatalog,
  type RollingBearingParserSpecCatalog,
  type RollingBearingSeriesCatalog,
  type RollingBearingSuffixCatalog,
  type RollingBearingUnknownOrReviewCatalog,
} from '@/domain/catalogData/bearings/loadBearingCatalogData';

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
  getRollingBearingFamilyIndexCatalog(): RollingBearingFamilyIndexCatalog;
  getRollingBearingManufacturerIndexCatalog(): RollingBearingManufacturerIndexCatalog;
  getRollingBearingBrandDetectionCatalog(): RollingBearingBrandDetectionCatalog;
  getRollingBearingBoreCodeCatalog(): RollingBearingBoreCodeCatalog;
  getRollingBearingDimensionCatalog(): RollingBearingDimensionCatalog;
  getRollingBearingSeriesCatalog(): RollingBearingSeriesCatalog;
  getRollingBearingSuffixCatalog(): RollingBearingSuffixCatalog;
  getRollingBearingParserSpecCatalog(): RollingBearingParserSpecCatalog;
  getRollingBearingGenerationSpecCatalog(): RollingBearingGenerationSpecCatalog;
  getRollingBearingMappingCatalog(): RollingBearingMappingCatalog;
  getRollingBearingUnknownOrReviewCatalog(): RollingBearingUnknownOrReviewCatalog;
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

  getRollingBearingFamilyIndexCatalog(): RollingBearingFamilyIndexCatalog {
    return getRollingBearingFamilyIndexCatalog();
  }

  getRollingBearingManufacturerIndexCatalog(): RollingBearingManufacturerIndexCatalog {
    return getRollingBearingManufacturerIndexCatalog();
  }

  getRollingBearingBrandDetectionCatalog(): RollingBearingBrandDetectionCatalog {
    return getRollingBearingBrandDetectionCatalog();
  }

  getRollingBearingBoreCodeCatalog(): RollingBearingBoreCodeCatalog {
    return getRollingBearingBoreCodeCatalog();
  }

  getRollingBearingDimensionCatalog(): RollingBearingDimensionCatalog {
    return getRollingBearingDimensionCatalog();
  }

  getRollingBearingSeriesCatalog(): RollingBearingSeriesCatalog {
    return getRollingBearingSeriesCatalog();
  }

  getRollingBearingSuffixCatalog(): RollingBearingSuffixCatalog {
    return getRollingBearingSuffixCatalog();
  }

  getRollingBearingParserSpecCatalog(): RollingBearingParserSpecCatalog {
    return getRollingBearingParserSpecCatalog();
  }

  getRollingBearingGenerationSpecCatalog(): RollingBearingGenerationSpecCatalog {
    return getRollingBearingGenerationSpecCatalog();
  }

  getRollingBearingMappingCatalog(): RollingBearingMappingCatalog {
    return getRollingBearingMappingCatalog();
  }

  getRollingBearingUnknownOrReviewCatalog(): RollingBearingUnknownOrReviewCatalog {
    return getRollingBearingUnknownOrReviewCatalog();
  }
}

const defaultLocalCatalogDataProvider = new LocalCatalogDataProvider();

export function getDefaultCatalogDataProvider(): CatalogDataProvider {
  return defaultLocalCatalogDataProvider;
}

import { getHydraulicCenterTypeOption } from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { resolveRexrothSpoolForGeneration } from '@/domain/codeCreator/resolveRexrothSpoolForGeneration';
import { synthesizeForTargetSeries } from '@/domain/categories/hydraulicValve/synthesizeHydraulicValveEquivalentCode';
import type { HydraulicEquivalentTokens } from '@/domain/categories/hydraulicValve/extractHydraulicEquivalentTokens';
import { defaultRexrothDesignSeries } from '@/domain/codeCreator/rexrothDesignSeriesOptions';
import { mapUnifiedCoilToRexroth } from '@/domain/codeCreator/hydraulicCoilVoltageCatalogOptions';
import { getWaysPositionsDisplay } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import type { HydraulicValveWaysPositions } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalTypes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getEquivalentGroups, getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import {
  collectUncertainFieldKeys,
  getCodeCreatorFields,
  getEquivalenceGroupIdForMounting,
  isUncertainSelection,
  seriesMatchesBrandFilter,
} from '@/domain/codeCreator/getCodeCreatorSchema';
import type {
  CodeCreatorBrandKey,
  CodeCreatorSelections,
  GeneratedProductCode,
  HydraulicValveMountingGroupKey,
} from '@/types/productCodeCreator';

function mapCoilToken(selection: string | null | undefined): string | null {
  if (isUncertainSelection(selection)) {
    return null;
  }
  return mapUnifiedCoilToRexroth(selection);
}

function mapManualToken(selection: string | null | undefined): string | null {
  if (isUncertainSelection(selection)) {
    return null;
  }
  if (selection === 'with') {
    return 'N9';
  }
  if (selection === 'without') {
    return 'none';
  }
  return null;
}

function mapConnectorToken(selection: string | null | undefined): string | null {
  if (isUncertainSelection(selection)) {
    return null;
  }
  if (selection === 'alternate') {
    return 'C4Z';
  }
  return 'K4';
}

function buildHydraulicTokens(
  selections: CodeCreatorSelections,
  mountingGroup: HydraulicValveMountingGroupKey
): HydraulicEquivalentTokens {
  const centerSelection = selections.center_condition;
  let spool: string | null = null;
  let functionCode: string | null = null;

  if (!isUncertainSelection(centerSelection) && centerSelection) {
    const centerOption = getHydraulicCenterTypeOption(centerSelection);
    if (centerOption) {
      spool = resolveRexrothSpoolForGeneration(centerOption);
      functionCode = centerOption.yukenFunctionToken;
      if (!functionCode && centerOption.vickersFunctionToken) {
        functionCode = centerOption.vickersFunctionToken;
      }
    }
  }

  const designSeries = isUncertainSelection(selections.design_series)
    ? defaultRexrothDesignSeries(mountingGroup)
    : selections.design_series ?? defaultRexrothDesignSeries(mountingGroup);

  return {
    spoolSymbol: spool,
    functionCode,
    coilRating: mapCoilToken(selections.coil_voltage),
    manualOverride: mapManualToken(selections.manual_override),
    connector: mapConnectorToken(selections.connector_type),
    designSeries,
    designSeriesFamily: null,
  };
}

function resolveGenerationStatus(code: string): GeneratedProductCode['status'] {
  const identification = identifyProduct(code, normalizeCode(code));
  return identification.outcome === 'full' ? 'generated_full' : 'generated_partial';
}

function buildCheckNotes(
  uncertainFields: string[],
  tokens: HydraulicEquivalentTokens,
  selections: CodeCreatorSelections
): string[] {
  const notes: string[] = [];

  if (selections.ways_positions && !isUncertainSelection(selections.ways_positions)) {
    notes.push(
      `Seçilen yol/konum: ${getWaysPositionsDisplay(selections.ways_positions as HydraulicValveWaysPositions)}.`
    );
  }

  if (uncertainFields.includes('center_condition') || !tokens.spoolSymbol) {
    notes.push('Merkez tipi seçilmedi; sürgü sembolü katalogdan kontrol edilmelidir.');
  }
  if (uncertainFields.includes('coil_voltage') || !tokens.coilRating) {
    notes.push('Bobin voltajı seçilmedi; gerilim alanı katalogdan doğrulanmalıdır.');
  }
  if (uncertainFields.includes('manual_override')) {
    notes.push('Manuel kumanda seçilmedi; hedef kodda manuel seçeneği kontrol edilmelidir.');
  }
  if (uncertainFields.includes('connector_type') || !tokens.connector) {
    notes.push('Konnektör seçilmedi; fiziksel uyumluluk katalogdan doğrulanmalıdır.');
  }

  return notes;
}

export function generateHydraulicValveCodes(options: {
  mountingGroup: HydraulicValveMountingGroupKey;
  brandFilter: CodeCreatorBrandKey | null;
  selections: CodeCreatorSelections;
}): { codes: GeneratedProductCode[]; checkNotes: string[] } {
  const fields = getCodeCreatorFields({
    category: 'hydraulic_valve',
    brandFilter: options.brandFilter,
    mountingGroup: options.mountingGroup,
  });
  const uncertainFields = collectUncertainFieldKeys(fields, options.selections);
  const tokens = buildHydraulicTokens(options.selections, options.mountingGroup);

  const groupId = getEquivalenceGroupIdForMounting(options.mountingGroup);
  const equivalenceGroup = getEquivalentGroups().find((group) => group.id === groupId);
  if (!equivalenceGroup) {
    return { codes: [], checkNotes: ['Montaj grubu bulunamadı.'] };
  }

  const codes: GeneratedProductCode[] = [];

  for (const seriesId of equivalenceGroup.seriesIds) {
    const series = getProductSeriesById(seriesId);
    if (!series) {
      continue;
    }
    if (!seriesMatchesBrandFilter(series.brand, options.brandFilter)) {
      continue;
    }

    const synthesized = synthesizeForTargetSeries(series, tokens);
    if (!synthesized) {
      continue;
    }

    const status = resolveGenerationStatus(synthesized);
    const notes: string[] = [];
    if (status === 'generated_partial') {
      notes.push('Kod oluşturuldu ancak tam parse doğrulanamadı; katalog kontrolü önerilir.');
    }

    codes.push({
      brand: series.brand,
      series: series.series,
      seriesId: series.id,
      code: synthesized,
      status,
      notes,
    });
  }

  return {
    codes,
    checkNotes: buildCheckNotes(uncertainFields, tokens, options.selections),
  };
}

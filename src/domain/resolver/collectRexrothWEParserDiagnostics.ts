import { normalizeProductCode } from '@/domain/attributes/extractors/attributeNormalization';
import {
  buildRexrothWEUserFacingParserMessages,
  diagnoseRexrothWECode,
  isRexrothWECode,
  type RexrothWEParserDiagnostics,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';

export function collectRexrothWEParserDiagnostics(
  inputCode: string,
  identification: ProductIdentification
): RexrothWEParserDiagnostics | null {
  if (identification.resolverCategoryKey !== HYDRAULIC_VALVE_CATEGORY) {
    return null;
  }

  const normalized = normalizeProductCode(inputCode);
  if (!isRexrothWECode(normalized)) {
    return null;
  }

  return diagnoseRexrothWECode(inputCode);
}

export function collectRexrothWEParserWarnings(
  inputCode: string,
  identification: ProductIdentification
): string[] {
  const diagnostics = collectRexrothWEParserDiagnostics(inputCode, identification);
  if (!diagnostics) {
    return [];
  }

  return buildRexrothWEUserFacingParserMessages(diagnostics).filter(
    (message) => message !== 'Tam çözümlenmiş katalog kodu'
  );
}

export type { RexrothWEParserDiagnostics };

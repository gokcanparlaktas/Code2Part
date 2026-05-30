import { buildSuggestedEquivalentCode } from "../buildSuggestedEquivalentCode";
import { compareProducts, resolveResolverCategory } from "../compareProducts";
import { findEquivalents } from "../findEquivalents";
import { getProductSeriesById, identifyProduct } from "../identifyProduct";
import { normalizeCode } from "../normalizeCode";
import { suggestProducts } from "../suggestProducts";

function identify(input: string) {
  const normalized = normalizeCode(input);
  return identifyProduct(input, normalized);
}

describe("hydraulic_valve category", () => {
  it("identifies DG4V-3-2A-M-U-H7-60 as full hydraulic_valve (exact catalog example)", () => {
    const result = identify("DG4V-3-2A-M-U-H7-60");
    expect(result.resolverCategoryKey).toBe("hydraulic_valve");
    expect(result.outcome).toBe("full");
    expect(result.brand.value).toBe("Vickers");
    expect(result.series.value).toBe("DG4V-3");
    expect(result.confidence).toBe("high");
  });

  it("identifies spaced compact DG4V example as the same product", () => {
    const result = identify("dg4v 3 2a m u h7 60");
    expect(result.outcome).toBe("full");
    expect(result.series.value).toBe("DG4V-3");
    expect(result.resolverCategoryKey).toBe("hydraulic_valve");
  });

  it("identifies 4WE6 as hydraulic_valve", () => {
    const result = identify("4WE6E-6X/EG24N9K4");
    expect(result.resolverCategoryKey).toBe("hydraulic_valve");
    expect(result.brand.value).toBe("Rexroth");
    expect(result.series.value).toBe("4WE6");
    expect(result.cetopNgSize?.value).toContain("NG6");
    expect(result.valveCoilVoltage?.evidence).toBe("code");
    expect(result.confidence).toBe("high");
  });

  it("identifies DSG-01 as hydraulic_valve", () => {
    const result = identify("DSG-01-3C2-D24-N1-50");
    expect(result.resolverCategoryKey).toBe("hydraulic_valve");
    expect(result.brand.value).toBe("Yuken");
    expect(result.series.value).toBe("DSG-01");
    expect(result.cetopNgSize?.value).toContain("NG6");
  });

  it("routes hydraulic_valve to hydraulic comparison", () => {
    const source = identify("4WE6E-6X/EG24N9K4");
    expect(resolveResolverCategory(source)).toBe("hydraulic_valve");

    const targetSeries = getProductSeriesById("yuken_dsg01");
    expect(targetSeries).toBeDefined();

    const candidate = {
      seriesId: targetSeries!.id,
      brand: targetSeries!.brand,
      series: targetSeries!.series,
      productType: targetSeries!.productType,
      productCategory: targetSeries!.productCategory,
      standardFamily: targetSeries!.standardFamily,
      suggestedCode:
        buildSuggestedEquivalentCode(source, targetSeries!) ?? null,
      targetIdentification: identify(
        buildSuggestedEquivalentCode(source, targetSeries!) ??
          "DSG-01-3C2-D24-N1-50",
        normalizeCode(
          buildSuggestedEquivalentCode(source, targetSeries!) ??
            "DSG-01-3C2-D24-N1-50",
        ),
      ),
    };

    const result = compareProducts(source, candidate);
    const checkFields = result.checkItems.map((c) => c.field);
    const compatibleLabels = result.compatible.map((c) => c.label);
    const differentLabels = result.different.map((c) => c.label);

    // Catalog pressure/flow values appear as compatible rows with review notes, not generic checks
    expect(compatibleLabels).toContain("Maks. basınç (A/B/P)");
    expect(compatibleLabels).toContain("Maks. debi");
    expect(checkFields).not.toContain("Basınç değeri");
    expect(checkFields).not.toContain("Debi değeri");

    // Known-equal attributes should be compatible (not "kontrol gerekli")
    expect(compatibleLabels).toContain("Montaj standardı");
    expect(compatibleLabels).toContain("Bobin voltajı");

    // Generic plug-in vs specific DIN connector requires catalog check, not a hard mismatch
    expect(checkFields).toContain("Konnektör tipi");
    // Cross-manufacturer spool: compatible by catalog portState, with candidate review warning
    expect(compatibleLabels).toContain("Sürgü davranışı");
    expect(checkFields).not.toContain("Sürgü sembolü / fonksiyon");
    expect(
      result.warnings.some((w) =>
        w.includes("Sipariş öncesi katalog, uygulama basıncı/debisi")
      ),
    ).toBe(true);
  });

  it("NG6 equivalents do not include NG10 series", () => {
    const source = identify("4WE6E-6X/EG24N9K4");
    const equivalents = findEquivalents(source);
    const ng10Series = equivalents.filter((e) =>
      ["4WE10", "DSG-03", "DG4V-5", "DHU", "D3W"].includes(e.series),
    );
    expect(ng10Series).toHaveLength(0);
  });

  it("marks different CETOP size as different in comparison", () => {
    const ng6 = identify("4WE6E-6X/EG24N9K4");
    const ng10Series = getProductSeriesById("rexroth_4we10")!;
    const ng10Code = "4WE10E-3X/CG24N9K4";
    const candidate = {
      seriesId: ng10Series.id,
      brand: ng10Series.brand,
      series: ng10Series.series,
      productType: ng10Series.productType,
      productCategory: ng10Series.productCategory,
      standardFamily: ng10Series.standardFamily,
      suggestedCode: ng10Code,
      targetIdentification: identify(ng10Code, normalizeCode(ng10Code)),
    };

    const result = compareProducts(ng6, candidate);
    expect(result.different.some((d) => d.label === "Montaj standardı")).toBe(
      true,
    );
  });

  describe("suggestions", () => {
    it('suggests 4WE6 example for "4WE6"', () => {
      const suggestions = suggestProducts("4WE6");
      expect(
        suggestions.some((s) => s.exampleCodeFormat.startsWith("4WE6")),
      ).toBe(true);
    });

    it('suggests DSG-01 example for "DSG 01"', () => {
      const suggestions = suggestProducts("DSG 01");
      expect(
        suggestions.some((s) => s.exampleCodeFormat.includes("DSG-01")),
      ).toBe(true);
    });

    it('suggests DSG example containing D24 and N1 for "D24 N1"', () => {
      const suggestions = suggestProducts("D24 N1");
      const match = suggestions.find((s) =>
        s.exampleCodeFormat.includes("DSG"),
      );
      expect(match).toBeDefined();
      expect(match!.exampleCodeFormat).toMatch(/D24/);
      expect(match!.exampleCodeFormat).toMatch(/N1/);
    });

    it("requires all tokens for multi-token hydraulic search", () => {
      const suggestions = suggestProducts("D24 N1");
      expect(
        suggestions.every((s) => {
          const compact = s.exampleCodeFormat
            .replace(/[^A-Z0-9]/gi, "")
            .toUpperCase();
          return compact.includes("D24") && compact.includes("N1");
        }),
      ).toBe(true);
      expect(
        suggestions.some((s) => s.exampleCodeFormat === "DSBC-32-25-PPSA-N3"),
      ).toBe(false);
    });

    it('suggests DG4V-3 example for "DG4V 3"', () => {
      const suggestions = suggestProducts("DG4V 3");
      expect(
        suggestions.some((s) => s.exampleCodeFormat.includes("DG4V-3")),
      ).toBe(true);
    });

    it('suggests Atos 24DC example for "24DC"', () => {
      const suggestions = suggestProducts("24DC");
      expect(
        suggestions.some(
          (s) =>
            s.exampleCodeFormat.includes("24DC") &&
            (s.series === "DHI" || s.series === "DHU"),
        ),
      ).toBe(true);
    });

    it("hydraulic suggestion missing labels exclude pneumatic fields", () => {
      const suggestions = suggestProducts("DG4V 3");
      const hydraulic = suggestions.find((s) =>
        s.exampleCodeFormat.includes("DG4V-3"),
      );
      expect(hydraulic).toBeDefined();

      const missingText = hydraulic!.missingFields.join(",");
      expect(missingText).not.toContain("stroke");
      expect(missingText).not.toContain("bore");
      expect(missingText).not.toContain("options");
      expect(hydraulic!.missingFields).not.toContain("stroke");
      expect(hydraulic!.missingFields).not.toContain("bore");
      expect(hydraulic!.missingFields).not.toContain("options");
    });
  });
});

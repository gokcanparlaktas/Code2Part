import { compareValveFunctionBehavior } from "@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior";
import { compareProducts } from "@/domain/resolver/compareProducts";
import {
    getProductSeriesById,
    identifyProduct,
} from "@/domain/resolver/identifyProduct";
import { normalizeCode } from "@/domain/resolver/normalizeCode";
import { calculateMatchPercentage } from "@/domain/scoring/calculateMatchPercentage";

function compare(options: {
  source: { manufacturer: string; series: string; token: string };
  target: { manufacturer: string; series: string; token: string };
}) {
  return compareValveFunctionBehavior({
    label: "Sürgü davranışı",
    source: options.source,
    target: options.target,
  });
}

describe("compareValveFunctionBehavior", () => {
  it("Rexroth E vs Rexroth E => compatible exact token (same manufacturer + series)", () => {
    const result = compare({
      source: { manufacturer: "Rexroth", series: "4WE6", token: "E" },
      target: { manufacturer: "Rexroth", series: "4WE6", token: "E" },
    });

    expect(result.comparison.status).toBe("compatible");
    expect(result.matchType).toBe("exact_token_match");
    expect(result.statusMessageTr).toBe("Sürgü/fonksiyon kodu aynı: E");
    expect(result.requiresCatalogCheck).toBe(true);
  });

  it("Rexroth E vs Yuken 3C2 => cautious check, not fully compatible", () => {
    const result = compare({
      source: { manufacturer: "Rexroth", series: "4WE6", token: "E" },
      target: { manufacturer: "Yuken", series: "DSG-01", token: "3C2" },
    });

    expect(result.comparison.status).toBe("unknownOrCheck");
    expect(result.comparison.status).not.toBe("compatible");
    expect(result.statusMessageTr).toContain("benzer olabilir");
    expect(result.statusMessageTr).toContain(
      "Katalog sembolüyle doğrulanmalıdır",
    );
    expect(result.statusMessageTr ?? "").not.toMatch(/aynıdır/i);
  });

  it("Yuken 3C2 vs Yuken 3C4 => different center behavior", () => {
    const result = compare({
      source: { manufacturer: "Yuken", series: "DSG-01", token: "3C2" },
      target: { manufacturer: "Yuken", series: "DSG-01", token: "3C4" },
    });

    expect(result.comparison.status).toBe("different");
    expect(result.statusMessageTr).toContain("Merkez konumu");
    expect(result.statusMessageTr).toContain("farklı olabilir");
  });

  it("Yuken 3C2 vs Yuken 3C60 => not compatible (closed vs open center)", () => {
    const result = compare({
      source: { manufacturer: "Yuken", series: "DSG-01", token: "3C2" },
      target: { manufacturer: "Yuken", series: "DSG-01", token: "3C60" },
    });

    expect(result.comparison.status).toBe("different");
    expect(result.comparison.status).not.toBe("compatible");
  });

  it("Atos 0711 vs Rexroth E => unknown/check, not compatible", () => {
    const result = compare({
      source: { manufacturer: "Atos", series: "DHI", token: "0711" },
      target: { manufacturer: "Rexroth", series: "4WE6", token: "E" },
    });

    expect(result.comparison.status).toBe("unknownOrCheck");
    expect(result.comparison.status).not.toBe("compatible");
    expect(result.statusMessageTr).toContain("katalogdan kontrol edilmelidir");
  });

  it("Vickers 2A vs Yuken 3C2 => unknown/check, not compatible", () => {
    const result = compare({
      source: { manufacturer: "Vickers", series: "DG4V-3", token: "2A" },
      target: { manufacturer: "Yuken", series: "DSG-01", token: "3C2" },
    });

    expect(result.comparison.status).toBe("unknownOrCheck");
    expect(result.comparison.status).not.toBe("compatible");
  });

  it("Yuken 3C12 vs Rexroth E => different center (tandem vs closed)", () => {
    const result = compare({
      source: { manufacturer: "Yuken", series: "DSG-01", token: "3C12" },
      target: { manufacturer: "Rexroth", series: "4WE6", token: "E" },
    });

    expect(result.comparison.status).toBe("different");
  });

  it("different centerCondition lowers match score vs same-function Yuken pair", () => {
    const source = identifyProduct(
      "DSG-01-3C2-D24-N1-50",
      normalizeCode("DSG-01-3C2-D24-N1-50"),
    );
    const yuken = getProductSeriesById("yuken_dsg01")!;

    const sameFunction = compareProducts(source, {
      seriesId: yuken.id,
      brand: yuken.brand,
      series: yuken.series,
      productType: yuken.productType,
      productCategory: yuken.productCategory,
      standardFamily: yuken.standardFamily,
      suggestedCode: "DSG-01-3C2-D24-N1-22",
      targetIdentification: identifyProduct(
        "DSG-01-3C2-D24-N1-22",
        normalizeCode("DSG-01-3C2-D24-N1-22"),
      ),
    });

    const differentCenter = compareProducts(source, {
      seriesId: yuken.id,
      brand: yuken.brand,
      series: yuken.series,
      productType: yuken.productType,
      productCategory: yuken.productCategory,
      standardFamily: yuken.standardFamily,
      suggestedCode: "DSG-01-3C4-D24-N1-50",
      targetIdentification: identifyProduct(
        "DSG-01-3C4-D24-N1-50",
        normalizeCode("DSG-01-3C4-D24-N1-50"),
      ),
    });

    const sameFunctionScore = calculateMatchPercentage(sameFunction).percentage;
    const differentCenterScore =
      calculateMatchPercentage(differentCenter).percentage;

    expect(
      sameFunction.compatible.some((c) => c.label === "Sürgü davranışı"),
    ).toBe(true);
    expect(
      differentCenter.different.some(
        (c) => c.label === "Sürgü davranışı",
      ),
    ).toBe(true);
    expect(differentCenterScore).toBeLessThan(sameFunctionScore);
  });

  it("similar behavior does not yield 100% match when catalog checks remain", () => {
    const source = identifyProduct(
      "4WE6E-6X/EG24N9K4",
      normalizeCode("4WE6E-6X/EG24N9K4"),
    );
    const yuken = getProductSeriesById("yuken_dsg01")!;
    const result = compareProducts(source, {
      seriesId: yuken.id,
      brand: yuken.brand,
      series: yuken.series,
      productType: yuken.productType,
      productCategory: yuken.productCategory,
      standardFamily: yuken.standardFamily,
      suggestedCode: "DSG-01-3C2-D24-N1-50",
      targetIdentification: identifyProduct(
        "DSG-01-3C2-D24-N1-50",
        normalizeCode("DSG-01-3C2-D24-N1-50"),
      ),
    });

    expect(calculateMatchPercentage(result).percentage).toBeLessThan(100);
    expect(
      result.compatible.some((c) => c.label === "Sürgü davranışı"),
    ).toBe(true);
    expect(
      result.warnings.some((w) =>
        w.includes("Sipariş öncesi katalog, uygulama basıncı/debisi")
      )
    ).toBe(true);
    expect(result.checkItems.some((c) => c.field === "Konnektör tipi")).toBe(true);
  });
});

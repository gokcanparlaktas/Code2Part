import { getTechnicalAttributes } from "@/domain/attributes/getTechnicalAttributes";
import {
    buildCandidateFallbackCanonicalProfile,
    buildHydraulicValveCanonicalProfile,
} from "@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile";
import { compareHydraulicValveCanonicalProfiles } from "@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles";
import {
    getCoilVoltageDisplay,
    getConnectorTypeDisplay,
    normalizeCoilVoltage,
    normalizeConnectorType,
    normalizeMountingStandard,
} from "@/domain/canonical/hydraulicValve/normalizeHydraulicValveAttribute";
import { compareProducts } from "@/domain/resolver/compareProducts";
import { getProductSeriesById, identifyProduct } from "@/domain/resolver/identifyProduct";
import { normalizeCode } from "@/domain/resolver/normalizeCode";

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

function buildProfile(input: string) {
  const id = identify(input);
  const attrs = getTechnicalAttributes(id);
  return buildHydraulicValveCanonicalProfile({
    identification: id,
    attributes: attrs,
  });
}

describe("normalizeHydraulicValveAttribute", () => {
  it("G24 and D24 normalize to same DC_24V", () => {
    expect(normalizeCoilVoltage({ rawToken: "G24" })).toBe("DC_24V");
    expect(normalizeCoilVoltage({ rawToken: "D24" })).toBe("DC_24V");
  });

  it("EG24 and 24DC normalize to same DC_24V", () => {
    expect(normalizeCoilVoltage({ rawToken: "EG24" })).toBe("DC_24V");
    expect(normalizeCoilVoltage({ rawToken: "24DC" })).toBe("DC_24V");
  });

  it("K4 displays DIN valve connector family", () => {
    const canonical = normalizeConnectorType({ rawToken: "K4", manufacturer: "Rexroth", series: "4WE6" });
    expect(canonical).toBe("DIN_VALVE_CONNECTOR");
    expect(getConnectorTypeDisplay(canonical)).toContain("DIN valf soketi");
  });

  it("C4Z displays AMP Junior-Timer", () => {
    const canonical = normalizeConnectorType({ rawToken: "C4Z", manufacturer: "Rexroth", series: "4WE6" });
    expect(canonical).toBe("AMP_JUNIOR_TIMER");
    expect(getConnectorTypeDisplay(canonical)).toContain("AMP");
  });

  it("N/N1 remain plug-in connector unless exact connector type is known", () => {
    expect(normalizeConnectorType({ rawToken: "N" })).toBe("PLUG_IN_CONNECTOR");
    expect(normalizeConnectorType({ rawToken: "N1" })).toBe(
      "PLUG_IN_CONNECTOR",
    );
  });

  it("NG6/CETOP03/D03/ISO4401-03 normalize to same mounting standard", () => {
    const expected = "ISO_4401_03_CETOP_03_NG6_NFPA_D03";
    expect(normalizeMountingStandard({ rawValue: "NG6" })).toBe(expected);
    expect(normalizeMountingStandard({ rawValue: "CETOP 03" })).toBe(expected);
    expect(normalizeMountingStandard({ rawValue: "D03" })).toBe(expected);
    expect(normalizeMountingStandard({ rawValue: "ISO4401-03" })).toBe(
      expected,
    );
  });
});

describe("compareHydraulicValveCanonicalProfiles", () => {
  it("G24 vs D24 compare as compatible voltage", () => {
    const rexroth = buildProfile("4WE6E-6X/EG24N9K4");
    const yuken = buildProfile("DSG-01-3C2-D24-N1-50");
    const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);

    const voltage = result.comparisons.find((c) => c.label === "Bobin voltajı");
    expect(voltage?.status).toBe("compatible");
    expect(voltage?.sourceDisplay).toBe("24V DC");
    expect(voltage?.targetDisplay).toBe("24V DC");
    expect(
      result.compatible.some((line) =>
        line.includes("Bobin voltajı aynı: 24V DC"),
      ),
    ).toBe(true);
  });

  it("Vickers H vs Rexroth EG24 compare as compatible voltage (catalog check warning only)", () => {
    const vickers = buildProfile("DG4V-3-2A-M-U-H7-60");
    const rexroth = buildProfile("4WE6E-6X/EG24N9K4");
    const result = compareHydraulicValveCanonicalProfiles(vickers, rexroth);

    const voltage = result.comparisons.find((c) => c.label === "Bobin voltajı");
    expect(voltage?.status).toBe("compatible");
    expect(voltage?.sourceDisplay).toBe("24V DC");
    expect(voltage?.targetDisplay).toBe("24V DC");
    expect(result.warnings.some((w) => w.toLowerCase().includes("bobin voltajı"))).toBe(true);
  });

  it("24V DC vs 110V AC is different", () => {
    const dc = buildProfile("4WE6E-6X/EG24N9K4");
    const acProfile = buildHydraulicValveCanonicalProfile({
      identification: identify("DSG-01-3C2-A110-N1-50"),
      attributes: [],
    });
    const ac = {
      ...acProfile,
      coilVoltage: {
        ...acProfile.coilVoltage,
        value: "AC_110V" as const,
        displayValue: getCoilVoltageDisplay("AC_110V"),
        rawToken: "A110",
      },
    };

    const result = compareHydraulicValveCanonicalProfiles(dc, ac);
    expect(
      result.different.some((line) => line.includes("Bobin voltajı farklı")),
    ).toBe(true);
  });

  it("220V AC vs 230V AC is not automatically compatible", () => {
    const ac220 = buildHydraulicValveCanonicalProfile({
      identification: identify("4WE6E-6X/EG24N9K4"),
      attributes: [],
    });
    const ac230 = buildHydraulicValveCanonicalProfile({
      identification: identify("4WE6E-6X/EG24N9K4"),
      attributes: [],
    });

    const left = {
      ...ac220,
      coilVoltage: {
        ...ac220.coilVoltage,
        value: "AC_220V" as const,
        displayValue: getCoilVoltageDisplay("AC_220V"),
      },
    };
    const right = {
      ...ac230,
      coilVoltage: {
        ...ac230.coilVoltage,
        value: "AC_230V" as const,
        displayValue: getCoilVoltageDisplay("AC_230V"),
      },
    };

    const result = compareHydraulicValveCanonicalProfiles(left, right);
    expect(
      result.comparisons.find((c) => c.label === "Bobin voltajı")?.status,
    ).toBe("different");
  });

  it("NG6 vs NG10 is critical different", () => {
    const ng6 = buildProfile("4WE6E-6X/EG24N9K4");
    const ng10 = buildProfile("4WE10E-3X/CG24N9K4");
    const result = compareHydraulicValveCanonicalProfiles(ng6, ng10);

    expect(
      result.comparisons.find((c) => c.label === "Montaj standardı")?.status,
    ).toBe("different");
    expect(
      result.different.some((line) => line.includes("Montaj standardı farklı")),
    ).toBe(true);
  });

  it("closed center vs tandem center is critical different", () => {
    const closed = buildProfile("4WE6E-6X/EG24N9K4");
    const tandem = buildProfile("DSG-01-3C12-D24-N1-50");
    const result = compareHydraulicValveCanonicalProfiles(closed, tandem);

    const merkez = result.comparisons.find((c) => c.label === "Merkez tipi");
    expect(merkez?.status).toBe("unknownOrCheck");
  });

  it("unknown center condition creates unknown/check", () => {
    const known = buildProfile("4WE6E-6X/EG24N9K4");
    const unknown = buildCandidateFallbackCanonicalProfile({
      brand: "Vickers",
      series: "DG4V",
      standardFamily: "CETOP 03 / NG6",
    });

    const result = compareHydraulicValveCanonicalProfiles(known, unknown);
    expect(
      result.unknownOrCheck.some((line) => line.includes("Merkez tipi")),
    ).toBe(true);
  });

  it("raw tokens remain accessible in evidence/detail", () => {
    const rexroth = buildProfile("4WE6E-6X/EG24N9K4");
    expect(rexroth.coilVoltage.rawToken).toBeTruthy();
    expect(rexroth.connectorType.rawToken).toBeTruthy();
    expect(rexroth.coilVoltage.displayValue).toBe("24V DC");
    expect(rexroth.coilVoltage.rawToken).not.toBe(
      rexroth.coilVoltage.displayValue,
    );
  });

  it("generic plug-in vs DIN connector goes to unknown/check not different", () => {
    const rexroth = buildProfile("4WE6E-6X/EG24N9K4");
    const yuken = buildProfile("DSG-01-3C2-D24-N1-70");
    const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);

    const connector = result.comparisons.find(
      (c) => c.label === "Konnektör tipi",
    );
    expect(connector?.status).toBe("unknownOrCheck");
    expect(
      result.unknownOrCheck.some((line) =>
        line.includes("Konnektör") && line.includes("katalog"),
      ),
    ).toBe(true);
  });
});

describe("buildHydraulicValveCanonicalProfile", () => {
  it("maps Rexroth WE6 parsed attributes into canonical profile", () => {
    const profile = buildProfile("4WE6E-7X/HG24N9K4");
    expect(profile.mountingStandard.value).toBe(
      "ISO_4401_03_CETOP_03_NG6_NFPA_D03",
    );
    expect(profile.mountingStandard.displayValue).toContain("NG6");
    expect(profile.coilVoltage.value).toBe("DC_24V");
    expect(profile.connectorType.value).toBe("DIN_VALVE_CONNECTOR");
    expect(profile.rawFunctionCode).toBe("E");
  });

  it("maps Yuken DSG parsed attributes into canonical profile", () => {
    const profile = buildProfile("DSG-01-3C2-D24-N1-70");
    expect(profile.mountingStandard.value).toBe(
      "ISO_4401_03_CETOP_03_NG6_NFPA_D03",
    );
    expect(profile.coilVoltage.value).toBe("DC_24V");
    expect(profile.connectorType.value).toBe("PLUG_IN_CONNECTOR");
    expect(profile.rawFunctionCode).toBe("3C2");
  });
});

describe("canonicalComparisonToCompatibilityResult integration", () => {
  it("compareProducts uses canonical voltage compatibility across brands", () => {
    const source = identify("4WE6E-6X/EG24N9K4");
    const targetSeries = getProductSeriesById("yuken_dsg01")!;
    const targetCode = "DSG-01-3C2-D24-N1-50";
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === "Bobin voltajı")).toBe(
      true,
    );
    expect(
      result.compatible.find((c) => c.label === "Bobin voltajı")?.sourceDisplay,
    ).toBe("24V DC");
  });
});

import { getTechnicalAttributes } from "@/domain/attributes/getTechnicalAttributes";
import { buildEvidenceDetailRows } from "@/domain/presentation/buildEvidenceDetailRows";
import { buildProductDetailRows } from "@/domain/presentation/buildProductDetailRows";
import { identifyProduct } from "@/domain/resolver/identifyProduct";
import { normalizeCode } from "@/domain/resolver/normalizeCode";

const HYDRAULIC_CODE = "4WE6E-6X/EG24N9K4";
const PNEUMATIC_CODE = "DSBC-50-100-PPVA-N3";

const PNEUMATIC_ONLY_LABELS = ["Çap", "Strok", "Sönümleme"];
const PNEUMATIC_ONLY_KEYS = ["bore", "stroke", "cushioning_type"];

const HYDRAULIC_ONLY_LABELS = [
  "CETOP / NG ölçüsü",
  "Sürgü / fonksiyon kodu",
  "Bobin voltajı",
  "Konnektör kodu",
];
const HYDRAULIC_ONLY_KEYS = [
  "function_code",
  "connector_type",
  "coil_rating",
  "mounting_standard",
];

describe("category-specific detail safety", () => {
  const hydraulicId = identifyProduct(
    HYDRAULIC_CODE,
    normalizeCode(HYDRAULIC_CODE),
  );
  const pneumaticId = identifyProduct(
    PNEUMATIC_CODE,
    normalizeCode(PNEUMATIC_CODE),
  );

  it("hydraulic product detail rows exclude pneumatic-only fields", () => {
    const labels = buildProductDetailRows(hydraulicId).map((r) => r.label);
    for (const label of PNEUMATIC_ONLY_LABELS) {
      expect(labels).not.toContain(label);
    }
  });

  it("hydraulic evidence rows exclude pneumatic-only fields", () => {
    const labels = buildEvidenceDetailRows(hydraulicId).map((r) => r.label);
    expect(labels).not.toContain("Çap");
    expect(labels).not.toContain("Strok");
  });

  it("hydraulic technical attributes exclude pneumatic-only keys", () => {
    const keys = getTechnicalAttributes(hydraulicId).map((a) => a.key);
    for (const key of PNEUMATIC_ONLY_KEYS) {
      expect(keys).not.toContain(key);
    }
  });

  it("pneumatic product detail rows exclude hydraulic-only fields", () => {
    const labels = buildProductDetailRows(pneumaticId).map((r) => r.label);
    for (const label of HYDRAULIC_ONLY_LABELS) {
      expect(labels).not.toContain(label);
    }
  });

  it("pneumatic evidence rows exclude hydraulic-only fields", () => {
    const labels = buildEvidenceDetailRows(pneumaticId).map((r) => r.label);
    for (const label of [
      "Sürgü / fonksiyon kodu",
      "Bobin voltajı",
      "Konnektör kodu",
    ]) {
      expect(labels).not.toContain(label);
    }
  });

  it("pneumatic technical attributes exclude hydraulic-only keys", () => {
    const keys = getTechnicalAttributes(pneumaticId).map((a) => a.key);
    for (const key of HYDRAULIC_ONLY_KEYS) {
      expect(keys).not.toContain(key);
    }
  });
});

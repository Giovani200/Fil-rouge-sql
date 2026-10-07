import { describe, expect, it } from "vitest";
import { formaterDate, formaterMois, formaterMoyenne, formaterNote } from "./format";

describe("format", () => {
  it("affiche une moyenne avec deux décimales et une virgule", () => {
    expect(formaterMoyenne(4.08)).toBe("4,08");
    expect(formaterMoyenne(4)).toBe("4,00");
    expect(formaterMoyenne(null)).toBe("—");
  });

  it("affiche une note au demi-point", () => {
    expect(formaterNote(4.5)).toBe("4,5");
    expect(formaterNote(5)).toBe("5,0");
  });

  it("affiche une date et un mois en français, sans décalage de fuseau", () => {
    expect(formaterDate("2026-03-13")).toBe("13 mars 2026");
    expect(formaterDate("2026-01-01")).toBe("1 janvier 2026");
    expect(formaterMois("2026-08")).toBe("août 2026");
  });
});

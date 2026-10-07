import { describe, expect, it } from "vitest";
import { VISITEUR } from "@/lib/visiteur";
import { decoderSegment, entierPositif, lireMembre, premierParametre } from "./parametres";

describe("entierPositif", () => {
  it("accepte un entier positif écrit en chiffres", () => {
    expect(entierPositif("12")).toBe(12);
  });

  it.each(["abc", "1.5", "-3", "0", "", "12abc", "007"])("refuse « %s »", (texte) => {
    expect(entierPositif(texte)).toBeNull();
  });
});

describe("lireMembre", () => {
  it("lit l'identifiant du cookie", () => {
    expect(lireMembre("5")).toBe(5);
  });

  it.each([undefined, "", "abc", "0", "-1"])("donne le visiteur pour %s", (valeur) => {
    expect(lireMembre(valeur)).toBe(VISITEUR);
  });
});

describe("premierParametre", () => {
  it("garde la première valeur non vide, sans espaces autour", () => {
    expect(premierParametre(" dark ")).toBe("dark");
    expect(premierParametre(["Drame", "Action"])).toBe("Drame");
  });

  it.each([undefined, "", "   ", []])("donne null pour %j", (valeur) => {
    expect(premierParametre(valeur)).toBeNull();
  });
});

describe("decoderSegment", () => {
  it("décode un segment d'URL encodé (pseudo accentué)", () => {
    expect(decoderSegment("maxou_cin%C3%A9")).toBe("maxou_ciné");
    expect(decoderSegment("lea.reel")).toBe("lea.reel");
  });

  it("donne null pour un encodage invalide", () => {
    expect(decoderSegment("%E0%A4%A")).toBeNull();
  });
});

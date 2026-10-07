import { describe, expect, it } from "vitest";
import { VISITEUR } from "@/lib/visiteur";
import { enTantQue } from "@/test/en-tant-que";
import { classementPondere, filmsQuiDivisent, realisateurs, top3ParGenre } from "./classements";

describe("classements", () => {
  it("compare la moyenne brute et la note pondérée (M10.2)", async () => {
    const classement = await enTantQue(VISITEUR, classementPondere);
    expect(classement).toHaveLength(10);
    expect(classement[0]).toMatchObject({ titre: "Retour vers le futur", rang_brut: 2, note_ponderee: 4.38, rang_pondere: 1 });
  });

  it("donne le top 3 par genre (M5.1)", async () => {
    const top = await enTantQue(VISITEUR, top3ParGenre);
    expect(top).toHaveLength(21);
    expect(top[0]).toMatchObject({ genre: "Action", rang: 1, titre: "The Dark Knight", moyenne: 4.5 });
  });

  it("classe les réalisateurs (M5.2)", async () => {
    const classement = await enTantQue(VISITEUR, realisateurs);
    expect(classement).toHaveLength(10);
    expect(classement[0]).toEqual({ rang: 1, realisateur: "Mathieu Kassovitz", moyenne: 4.75, nb_notes: 4 });
  });

  it("trouve les films qui divisent (M3.3)", async () => {
    const films = await enTantQue(VISITEUR, filmsQuiDivisent);
    expect(films).toHaveLength(5);
    expect(films[0]).toMatchObject({ titre: "Inception", pire: 2, meilleure: 5, ecart: 3 });
  });
});

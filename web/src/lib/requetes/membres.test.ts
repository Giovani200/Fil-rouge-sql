import { describe, expect, it } from "vitest";
import { VISITEUR } from "@/lib/visiteur";
import { enTantQue } from "@/test/en-tant-que";
import { aVoirEnsuite, carteProfil, compatibilite, journalMembre, listeMembres, visionnagesCumules } from "./membres";

const CINEPHILE = 1;
const LEA = 5;

describe("membres", () => {
  it("liste les 8 membres avec leur nombre de notes", async () => {
    const membres = await enTantQue(VISITEUR, listeMembres);
    expect(membres).toHaveLength(8);
    expect(membres[0]).toEqual({ id: 7, pseudo: "bobine", ville: "Bordeaux", nb_notes: 22 });
  });

  it("construit la carte de profil (M3.1)", async () => {
    expect(await enTantQue(VISITEUR, (client) => carteProfil(client, "cinephile_92"))).toMatchObject({
      id: CINEPHILE,
      ville: "Nanterre",
      inscrit_le: "2024-03-12",
      nb_films_notes: 21,
      note_moyenne: 4.1,
      genre_prefere: "Science-fiction",
      coup_de_coeur_id: 18,
      coup_de_coeur: "Seven",
    });
    expect(await enTantQue(VISITEUR, (client) => carteProfil(client, "inconnu"))).toBeNull();
  });

  it("ne montre les entrées privées du journal qu'à leur auteur (RLS, M16.2)", async () => {
    const vuParLea = await enTantQue(LEA, (client) => journalMembre(client, "lea.reel"));
    expect(vuParLea).toHaveLength(20);
    expect(vuParLea.filter((entree) => entree.prive)).toHaveLength(5);

    const vuParCinephile = await enTantQue(CINEPHILE, (client) => journalMembre(client, "lea.reel"));
    expect(vuParCinephile.filter((entree) => entree.prive)).toHaveLength(0);

    const vuParVisiteur = await enTantQue(VISITEUR, (client) => journalMembre(client, "lea.reel"));
    expect(vuParVisiteur.filter((entree) => entree.prive)).toHaveLength(0);
  });

  it("cumule les visionnages mois par mois (M6.1)", async () => {
    const mois = await enTantQue(LEA, (client) => visionnagesCumules(client, "lea.reel"));
    expect(mois[0]).toEqual({ mois: "2026-01", nb: 1, cumul: 1 });
    expect(mois.at(-1)?.cumul).toBe(34);
  });

  it("propose les films à voir ensuite (M3.2)", async () => {
    const films = await enTantQue(LEA, (client) => aVoirEnsuite(client, "lea.reel"));
    expect(films).toHaveLength(6);
    expect(films[0].titre).toBe("Once Upon a Time… in Hollywood");
  });

  it("mesure la compatibilité entre deux membres (M10.3)", async () => {
    const communs = await enTantQue(VISITEUR, (client) => compatibilite(client, "cinephile_92", "nolanfan"));
    expect(communs).toHaveLength(12);
    expect(communs[0]).toEqual({ titre: "Inception", note_a: 5, note_b: 3.5, ecart: 1.5, films_communs: 12, ecart_moyen: 0.63 });
  });
});

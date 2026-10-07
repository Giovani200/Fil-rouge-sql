import { describe, expect, it } from "vitest";
import { VISITEUR } from "@/lib/visiteur";
import { enTantQue } from "@/test/en-tant-que";
import {
  catalogue,
  distribution,
  evolution,
  fiche,
  genres,
  incrementerVues,
  maNote,
  noter,
  rechercher,
  saga,
  tagsPopulaires,
} from "./films";

const LEA = 5;
const INCEPTION = 12;

describe("catalogue et recherche", () => {
  it("liste les 30 films sans filtre de genre", async () => {
    expect(await enTantQue(VISITEUR, (client) => catalogue(client, null))).toHaveLength(30);
  });

  it("filtre par genre, avec les statistiques de films_stats et les tags JSONB", async () => {
    const films = await enTantQue(VISITEUR, (client) => catalogue(client, "Science-fiction"));
    expect(films).toHaveLength(7);
    expect(films[0]).toMatchObject({ titre: "Inception", moyenne: 4.08, nb_notes: 6, tags: ["rêves", "braquage"] });
  });

  it("recherche par titre avec rechercher_films", async () => {
    const films = await enTantQue(VISITEUR, (client) => rechercher(client, "dark"));
    expect(films.map((film) => film.titre)).toEqual(["The Dark Knight", "The Dark Knight Rises"]);
  });

  it("traite une apostrophe comme du texte et ne se laisse pas injecter", async () => {
    const avecApostrophe = await enTantQue(VISITEUR, (client) => rechercher(client, "d'"));
    expect(avecApostrophe.map((film) => film.titre)).toEqual(["Des hommes d'honneur", "Le Fabuleux Destin d'Amélie Poulain"]);
    expect(await enTantQue(VISITEUR, (client) => rechercher(client, "x' OR '1'='1"))).toEqual([]);
  });

  it("donne les genres et les tags les plus fréquents", async () => {
    expect(await enTantQue(VISITEUR, genres)).toHaveLength(9);
    const tags = await enTantQue(VISITEUR, tagsPopulaires);
    expect(tags[0]).toEqual({ tag: "culte", nb_films: 6 });
  });
});

describe("fiche film", () => {
  it("assemble v_fiche_film, duree_texte, films_stats et note_ponderee", async () => {
    const film = await enTantQue(VISITEUR, (client) => fiche(client, INCEPTION));
    expect(film).toMatchObject({
      titre: "Inception",
      annee: 2010,
      realisateurs: "Christopher Nolan",
      duree: "2 h 28",
      pays: ["États-Unis", "Royaume-Uni"],
      nb_notes: 6,
      moyenne: 4.08,
      note_ponderee: 4.05,
      nb_vues: expect.any(Number),
    });
  });

  it("renvoie null pour un film inconnu", async () => {
    expect(await enTantQue(VISITEUR, (client) => fiche(client, 999))).toBeNull();
  });

  it("donne la distribution, la saga ordonnée et l'évolution de la note", async () => {
    const acteurs = await enTantQue(VISITEUR, (client) => distribution(client, INCEPTION));
    expect(acteurs).toHaveLength(6);
    expect(acteurs[0]).toBe("Elliot Page");

    const episodes = await enTantQue(VISITEUR, (client) => saga(client, 29));
    expect(episodes.map((episode) => episode.titre)).toEqual(["Retour vers le futur", "Retour vers le futur II", "Retour vers le futur III"]);
    expect(await enTantQue(VISITEUR, (client) => saga(client, INCEPTION))).toEqual([]);

    const points = await enTantQue(VISITEUR, (client) => evolution(client, INCEPTION));
    expect(points).toHaveLength(6);
    expect(points[0]).toEqual({ note_le: "2026-03-13", pseudo: "darkroom", note: 5, moyenne_cumulee: 5 });
    expect(points.at(-1)?.moyenne_cumulee).toBe(4.08);
  });

  it("donne la note du membre connecté, et rien pour le visiteur", async () => {
    expect(await enTantQue(LEA, (client) => maNote(client, INCEPTION, LEA))).toBe(4.5);
    expect(await enTantQue(VISITEUR, (client) => maNote(client, INCEPTION, VISITEUR))).toBeNull();
  });
});

describe("noter et compter les vues", () => {
  it("note avec la procédure noter : le trigger met films_stats à jour", async () => {
    const resultat = await enTantQue(LEA, async (client) => {
      const moyenne = await noter(client, LEA, "Inception", "4");
      const apres = await fiche(client, INCEPTION);
      return { moyenne, moyenneStats: apres?.moyenne };
    });
    expect(resultat).toEqual({ moyenne: 4, moyenneStats: 4 });
  });

  it("remonte les refus de la procédure (M13.2)", async () => {
    await expect(enTantQue(LEA, (client) => noter(client, LEA, "Inception", "6"))).rejects.toThrow(
      "Note invalide : 6 (de 0,5 à 5, par demi-point)",
    );
    await expect(enTantQue(LEA, (client) => noter(client, LEA, "Avatar", "4"))).rejects.toThrow("Film inconnu : Avatar");
    await expect(enTantQue(VISITEUR, (client) => noter(client, VISITEUR, "Inception", "4"))).rejects.toThrow("Membre inconnu");
    await expect(enTantQue(LEA, (client) => noter(client, LEA, "Inception", null))).rejects.toThrow("Note invalide");
  });

  it("incrémente le compteur de vues de façon atomique", async () => {
    const vues = await enTantQue(VISITEUR, async (client) => {
      const avant = (await fiche(client, INCEPTION))?.nb_vues;
      const apres = await incrementerVues(client, INCEPTION);
      return { avant, apres };
    });
    expect(vues.apres).toBe((vues.avant ?? 0) + 1);
  });
});

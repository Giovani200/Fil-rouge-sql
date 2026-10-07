import type { PoolClient } from "pg";
import { lignes, premiereLigne, type Requete } from "@/lib/requete";

export type FilmCatalogue = {
  id: number;
  titre: string;
  annee: number;
  genre: string;
  tags: string[];
  moyenne: number | null;
  nb_notes: number | null;
};

export const CATALOGUE: Requete = {
  mission: "M8 · JSONB + films_stats (M13.3, tenue à jour par le trigger M14.1)",
  sql: `
SELECT films.id, films.titre, films.annee, films.genre, films.details -> 'tags' AS tags,
       films_stats.moyenne, films_stats.nb_notes
FROM films
LEFT JOIN films_stats ON films_stats.film_id = films.id
WHERE $1::TEXT IS NULL OR films.genre = $1
ORDER BY films.titre`.trim(),
};

export const RECHERCHE: Requete = {
  mission: "M16.3 · rechercher_films, la saisie passe en paramètre",
  sql: `
SELECT films.id, films.titre, films.annee, films.genre, films.details -> 'tags' AS tags,
       films_stats.moyenne, films_stats.nb_notes
FROM rechercher_films($1) AS resultats
JOIN films ON films.titre = resultats.titre AND films.annee = resultats.annee
LEFT JOIN films_stats ON films_stats.film_id = films.id
ORDER BY films.titre`.trim(),
};

const GENRES: Requete = {
  mission: "Genres du catalogue",
  sql: "SELECT DISTINCT genre FROM films ORDER BY genre",
};

export const TAGS_POPULAIRES: Requete = {
  mission: "M8.3 · tags les plus fréquents (jsonb_array_elements_text + LATERAL)",
  sql: `
SELECT tags.tag, COUNT(*) AS nb_films FROM films
CROSS JOIN LATERAL jsonb_array_elements_text(films.details -> 'tags') AS tags (tag)
GROUP BY tags.tag
ORDER BY nb_films DESC, tags.tag
LIMIT 5`.trim(),
};

export function catalogue(client: PoolClient, genre: string | null): Promise<FilmCatalogue[]> {
  return lignes<FilmCatalogue>(client, CATALOGUE, [genre]);
}

export function rechercher(client: PoolClient, texte: string): Promise<FilmCatalogue[]> {
  return lignes<FilmCatalogue>(client, RECHERCHE, [texte]);
}

export async function genres(client: PoolClient): Promise<string[]> {
  return (await lignes<{ genre: string }>(client, GENRES)).map((ligne) => ligne.genre);
}

export function tagsPopulaires(client: PoolClient): Promise<{ tag: string; nb_films: number }[]> {
  return lignes(client, TAGS_POPULAIRES);
}

export type FicheFilm = {
  id: number;
  titre: string;
  annee: number;
  genre: string;
  realisateurs: string | null;
  duree: string;
  nb_vues: number;
  pays: string[];
  tags: string[];
  nb_notes: number | null;
  moyenne: number | null;
  note_ponderee: number | null;
};

export const FICHE: Requete = {
  mission: "M9.1 v_fiche_film · M10.1 duree_texte · M10.2 note_ponderee · M14.1 films_stats",
  sql: `
SELECT v_fiche_film.id, v_fiche_film.titre, v_fiche_film.annee, v_fiche_film.genre, v_fiche_film.realisateurs,
       duree_texte(v_fiche_film.duree_min) AS duree, films.nb_vues,
       films.details -> 'pays' AS pays, films.details -> 'tags' AS tags,
       films_stats.nb_notes, films_stats.moyenne,
       CASE WHEN films_stats.nb_notes > 0 THEN ROUND(note_ponderee(v_fiche_film.id), 2) END AS note_ponderee
FROM v_fiche_film
JOIN films ON films.id = v_fiche_film.id
LEFT JOIN films_stats ON films_stats.film_id = v_fiche_film.id
WHERE v_fiche_film.id = $1`.trim(),
};

export const DISTRIBUTION: Requete = {
  mission: "M2.2 · casting",
  sql: `
SELECT personnes.nom FROM casting
JOIN personnes ON personnes.id = casting.personne_id
WHERE casting.film_id = $1 AND casting.role = 'acteur'
ORDER BY personnes.nom`.trim(),
};

export type Episode = { episode: number; id: number; titre: string; annee: number; saga: string };

export const SAGA: Requete = {
  mission: "M4.1 · CTE récursive sur film_precedent_id",
  sql: `
WITH RECURSIVE episodes AS (
    SELECT films.id, films.titre, films.annee, films.saga_id, 1 AS episode FROM films
    WHERE films.saga_id = (SELECT saga_id FROM films WHERE id = $1) AND films.film_precedent_id IS NULL
    UNION ALL
    SELECT films.id, films.titre, films.annee, films.saga_id, episodes.episode + 1 FROM films
    JOIN episodes ON films.film_precedent_id = episodes.id
)
SELECT episodes.episode, episodes.id, episodes.titre, episodes.annee, sagas.nom AS saga FROM episodes
JOIN sagas ON sagas.id = episodes.saga_id
ORDER BY episodes.episode`.trim(),
};

export type PointEvolution = { note_le: string; pseudo: string; note: number; moyenne_cumulee: number };

export const EVOLUTION: Requete = {
  mission: "M6.2 · moyenne cumulée avec AVG() OVER",
  sql: `
SELECT notes.note_le, utilisateurs.pseudo, notes.note,
       ROUND(AVG(notes.note) OVER (ORDER BY notes.note_le, utilisateurs.pseudo
                                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 2) AS moyenne_cumulee
FROM notes
JOIN utilisateurs ON utilisateurs.id = notes.utilisateur_id
WHERE notes.film_id = $1
ORDER BY notes.note_le, utilisateurs.pseudo`.trim(),
};

const MA_NOTE: Requete = {
  mission: "Note du membre connecté",
  sql: "SELECT note FROM notes WHERE film_id = $1 AND utilisateur_id = $2",
};

const PSEUDO: Requete = {
  mission: "Pseudo du membre connecté",
  sql: "SELECT pseudo FROM utilisateurs WHERE id = $1",
};

export const NOTER: Requete = {
  mission: "M13.1 · CALL noter (validation, upsert, journal, nouvelle moyenne)",
  sql: "CALL noter($1, $2, $3)",
};

export const INCREMENTER_VUES: Requete = {
  mission: "M15.2 · incrément atomique, sans vue perdue",
  sql: "UPDATE films SET nb_vues = nb_vues + 1 WHERE id = $1 RETURNING nb_vues",
};

export function fiche(client: PoolClient, id: number): Promise<FicheFilm | null> {
  return premiereLigne<FicheFilm>(client, FICHE, [id]);
}

export async function distribution(client: PoolClient, filmId: number): Promise<string[]> {
  return (await lignes<{ nom: string }>(client, DISTRIBUTION, [filmId])).map((ligne) => ligne.nom);
}

export function saga(client: PoolClient, filmId: number): Promise<Episode[]> {
  return lignes<Episode>(client, SAGA, [filmId]);
}

export function evolution(client: PoolClient, filmId: number): Promise<PointEvolution[]> {
  return lignes<PointEvolution>(client, EVOLUTION, [filmId]);
}

export async function maNote(client: PoolClient, filmId: number, membreId: number): Promise<number | null> {
  return (await premiereLigne<{ note: number }>(client, MA_NOTE, [filmId, membreId]))?.note ?? null;
}

/**
 * Note un film avec la procédure `noter` du fil rouge et renvoie la nouvelle moyenne.
 * La procédure valide tout (note, membre, film) : un membre inconnu lui est transmis
 * comme NULL, et c'est elle qui lève « Membre inconnu ».
 */
export async function noter(client: PoolClient, membreId: number, titre: string, note: string | null): Promise<number> {
  const membre = await premiereLigne<{ pseudo: string }>(client, PSEUDO, [membreId]);
  const [resultat] = await lignes<{ p_moyenne: number }>(client, NOTER, [membre?.pseudo ?? null, titre, note]);
  return resultat.p_moyenne;
}

export async function incrementerVues(client: PoolClient, filmId: number): Promise<number | null> {
  return (await premiereLigne<{ nb_vues: number }>(client, INCREMENTER_VUES, [filmId]))?.nb_vues ?? null;
}

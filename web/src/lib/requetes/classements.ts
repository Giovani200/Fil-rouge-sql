import type { PoolClient } from "pg";
import { lignes, type Requete } from "@/lib/requete";

export type LigneClassement = {
  id: number;
  titre: string;
  nb_notes: number;
  moyenne: number;
  rang_brut: number;
  note_ponderee: number;
  rang_pondere: number;
};

export const CLASSEMENT_PONDERE: Requete = {
  mission: "M10.2 · note_ponderee (formule du Top 250 d'IMDb) contre moyenne brute",
  sql: `
WITH stats AS (
    SELECT films.id, films.titre, COUNT(*) AS nb_notes, ROUND(AVG(notes.note), 2) AS moyenne,
           ROUND(note_ponderee(films.id), 2) AS note_ponderee
    FROM films
    JOIN notes ON notes.film_id = films.id
    GROUP BY films.id, films.titre
),
classement AS (
    SELECT id, titre, nb_notes, moyenne, RANK() OVER (ORDER BY moyenne DESC) AS rang_brut,
           note_ponderee, RANK() OVER (ORDER BY note_ponderee DESC) AS rang_pondere
    FROM stats
)
SELECT id, titre, nb_notes, moyenne, rang_brut, note_ponderee, rang_pondere FROM classement
WHERE rang_pondere <= 10
ORDER BY rang_pondere, nb_notes DESC, titre`.trim(),
};

export type LigneTopGenre = { id: number; genre: string; rang: number; titre: string; moyenne: number };

export const TOP_3_PAR_GENRE: Requete = {
  mission: "M5.1 · ROW_NUMBER() OVER (PARTITION BY genre)",
  sql: `
WITH moyennes AS (
    SELECT films.id, films.genre, films.titre, ROUND(AVG(notes.note), 2) AS moyenne FROM films
    JOIN notes ON notes.film_id = films.id
    GROUP BY films.id, films.genre, films.titre
    HAVING COUNT(*) >= 3
),
classement AS (
    SELECT id, genre, titre, moyenne, ROW_NUMBER() OVER (PARTITION BY genre ORDER BY moyenne DESC, titre) AS rang
    FROM moyennes
)
SELECT id, genre, rang, titre, moyenne FROM classement
WHERE rang <= 3
ORDER BY genre, rang`.trim(),
};

export type LigneRealisateur = { rang: number; realisateur: string; moyenne: number; nb_notes: number };

export const REALISATEURS: Requete = {
  mission: "M5.2 · DENSE_RANK() des réalisateurs",
  sql: `
WITH moyennes AS (
    SELECT personnes.nom AS realisateur, ROUND(AVG(notes.note), 2) AS moyenne, COUNT(*) AS nb_notes FROM personnes
    JOIN casting ON casting.personne_id = personnes.id AND casting.role = 'realisateur'
    JOIN notes ON notes.film_id = casting.film_id
    GROUP BY personnes.id, personnes.nom
)
SELECT DENSE_RANK() OVER (ORDER BY moyenne DESC) AS rang, realisateur, moyenne, nb_notes FROM moyennes
ORDER BY rang, realisateur
LIMIT 10`.trim(),
};

export type FilmQuiDivise = { id: number; titre: string; pire: number; meilleure: number; ecart: number };

export const FILMS_QUI_DIVISENT: Requete = {
  mission: "M3.3 · écart entre la pire et la meilleure note",
  sql: `
SELECT films.id, films.titre, MIN(notes.note) AS pire, MAX(notes.note) AS meilleure,
       MAX(notes.note) - MIN(notes.note) AS ecart
FROM films
JOIN notes ON notes.film_id = films.id
GROUP BY films.id, films.titre
ORDER BY ecart DESC, films.titre
LIMIT 5`.trim(),
};

export function classementPondere(client: PoolClient): Promise<LigneClassement[]> {
  return lignes<LigneClassement>(client, CLASSEMENT_PONDERE);
}

export function top3ParGenre(client: PoolClient): Promise<LigneTopGenre[]> {
  return lignes<LigneTopGenre>(client, TOP_3_PAR_GENRE);
}

export function realisateurs(client: PoolClient): Promise<LigneRealisateur[]> {
  return lignes<LigneRealisateur>(client, REALISATEURS);
}

export function filmsQuiDivisent(client: PoolClient): Promise<FilmQuiDivise[]> {
  return lignes<FilmQuiDivise>(client, FILMS_QUI_DIVISENT);
}

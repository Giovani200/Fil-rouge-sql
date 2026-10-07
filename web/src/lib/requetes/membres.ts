import type { PoolClient } from "pg";
import { lignes, premiereLigne, type Requete } from "@/lib/requete";

export type Membre = { id: number; pseudo: string; ville: string | null; nb_notes: number };

export const LISTE_MEMBRES: Requete = {
  mission: "M2.5 · LEFT JOIN + COUNT par membre",
  sql: `
SELECT utilisateurs.id, utilisateurs.pseudo, utilisateurs.ville, COUNT(notes.film_id) AS nb_notes
FROM utilisateurs
LEFT JOIN notes ON notes.utilisateur_id = utilisateurs.id
GROUP BY utilisateurs.id
ORDER BY utilisateurs.pseudo`.trim(),
};

export type CarteProfil = {
  id: number;
  pseudo: string;
  ville: string | null;
  inscrit_le: string;
  nb_films_notes: number;
  note_moyenne: number | null;
  genre_prefere: string | null;
  coup_de_coeur_id: number | null;
  coup_de_coeur: string | null;
};

export const CARTE_PROFIL: Requete = {
  mission: "M3.1 · carte de profil en CTE",
  sql: `
WITH membre AS (
    SELECT id, pseudo, ville, inscrit_le FROM utilisateurs WHERE pseudo = $1
),
nombre_notes AS (
    SELECT COUNT(*) AS nb_films_notes, ROUND(AVG(note), 2) AS note_moyenne FROM notes
    WHERE utilisateur_id = (SELECT id FROM membre)
),
genre_favori AS (
    SELECT films.genre AS genre_prefere FROM notes
    JOIN films ON films.id = notes.film_id
    WHERE notes.utilisateur_id = (SELECT id FROM membre)
    GROUP BY films.genre
    ORDER BY COUNT(*) DESC, films.genre
    LIMIT 1
),
film_favori AS (
    SELECT films.id AS coup_de_coeur_id, films.titre AS coup_de_coeur FROM notes
    JOIN films ON films.id = notes.film_id
    WHERE notes.utilisateur_id = (SELECT id FROM membre)
    ORDER BY notes.note DESC, notes.note_le
    LIMIT 1
)
SELECT membre.id, membre.pseudo, membre.ville, membre.inscrit_le,
       nombre_notes.nb_films_notes, nombre_notes.note_moyenne,
       genre_favori.genre_prefere, film_favori.coup_de_coeur_id, film_favori.coup_de_coeur
FROM membre
CROSS JOIN nombre_notes
LEFT JOIN genre_favori ON true
LEFT JOIN film_favori ON true`.trim(),
};

export type EntreeJournal = { id: number; date_visionnage: string; prive: boolean; film_id: number; titre: string };

export const JOURNAL: Requete = {
  mission: "M16.2 · la RLS filtre seule les entrées privées des autres membres",
  sql: `
SELECT journal.id, journal.date_visionnage, journal.prive, films.id AS film_id, films.titre FROM journal
JOIN films ON films.id = journal.film_id
JOIN utilisateurs ON utilisateurs.id = journal.utilisateur_id
WHERE utilisateurs.pseudo = $1
ORDER BY journal.date_visionnage DESC, journal.id DESC
LIMIT 20`.trim(),
};

export type MoisVisionnages = { mois: string; nb: number; cumul: number };

export const VISIONNAGES_CUMULES: Requete = {
  mission: "M6.1 · SUM() OVER (ORDER BY mois)",
  sql: `
WITH par_mois AS (
    SELECT TO_CHAR(journal.date_visionnage, 'YYYY-MM') AS mois, COUNT(*) AS nb FROM journal
    JOIN utilisateurs ON utilisateurs.id = journal.utilisateur_id
    WHERE utilisateurs.pseudo = $1
    GROUP BY mois
)
SELECT mois, nb, SUM(nb) OVER (ORDER BY mois) AS cumul FROM par_mois
ORDER BY mois`.trim(),
};

export type FilmAVoir = { id: number; titre: string; annee: number };

export const A_VOIR_ENSUITE: Requete = {
  mission: "M3.2 · NOT EXISTS sur le journal",
  sql: `
SELECT films.id, films.titre, films.annee FROM films
WHERE NOT EXISTS (
    SELECT 1 FROM journal
    JOIN utilisateurs ON utilisateurs.id = journal.utilisateur_id
    WHERE journal.film_id = films.id AND utilisateurs.pseudo = $1
)
ORDER BY films.annee DESC, films.titre
LIMIT 6`.trim(),
};

export type FilmCommun = {
  titre: string;
  note_a: number;
  note_b: number;
  ecart: number;
  films_communs: number;
  ecart_moyen: number;
};

export const COMPATIBILITE: Requete = {
  mission: "M10.3 · fonction compatibilite + agrégats fenêtrés",
  sql: `
SELECT titre, note_a, note_b, ecart,
       COUNT(*) OVER () AS films_communs, ROUND(AVG(ecart) OVER (), 2) AS ecart_moyen
FROM compatibilite($1, $2)
ORDER BY ecart DESC, titre`.trim(),
};

export function listeMembres(client: PoolClient): Promise<Membre[]> {
  return lignes<Membre>(client, LISTE_MEMBRES);
}

export function carteProfil(client: PoolClient, pseudo: string): Promise<CarteProfil | null> {
  return premiereLigne<CarteProfil>(client, CARTE_PROFIL, [pseudo]);
}

export function journalMembre(client: PoolClient, pseudo: string): Promise<EntreeJournal[]> {
  return lignes<EntreeJournal>(client, JOURNAL, [pseudo]);
}

export function visionnagesCumules(client: PoolClient, pseudo: string): Promise<MoisVisionnages[]> {
  return lignes<MoisVisionnages>(client, VISIONNAGES_CUMULES, [pseudo]);
}

export function aVoirEnsuite(client: PoolClient, pseudo: string): Promise<FilmAVoir[]> {
  return lignes<FilmAVoir>(client, A_VOIR_ENSUITE, [pseudo]);
}

export function compatibilite(client: PoolClient, pseudoA: string, pseudoB: string): Promise<FilmCommun[]> {
  return lignes<FilmCommun>(client, COMPATIBILITE, [pseudoA, pseudoB]);
}

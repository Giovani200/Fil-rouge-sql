-- =====================================================================
--  FilmBox — complément séance 2
--  À exécuter sur la base filmbox, APRÈS filmbox.sql.
--  Ajoute à chaque film une fiche détaillée en JSONB.
--  Durées indicatives (en minutes) ; tags attribués par la rédaction FilmBox.
--  Script ré-exécutable : il supprime aussi les objets créés pendant les missions M9 et M10.
-- =====================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_stats_films CASCADE;
DROP VIEW IF EXISTS v_fiche_film, v_films_sf CASCADE;
DROP FUNCTION IF EXISTS duree_texte(INTEGER), note_ponderee(INTEGER, INTEGER), compatibilite(TEXT, TEXT);
ALTER TABLE films DROP COLUMN IF EXISTS details CASCADE;

ALTER TABLE films ADD COLUMN details JSONB;

UPDATE films f
SET details = v.details::JSONB
FROM (VALUES
 ('Apollo 13',                            '{"duree": 140, "pays": ["États-Unis"], "langue": "anglais", "tags": ["espace", "histoire vraie"]}'),
 ('Mystic River',                         '{"duree": 138, "pays": ["États-Unis"], "langue": "anglais", "tags": ["enquête", "drame familial"]}'),
 ('Des hommes d''honneur',                '{"duree": 138, "pays": ["États-Unis"], "langue": "anglais", "tags": ["procès", "armée"]}'),
 ('X-Men : Le Commencement',              '{"duree": 132, "pays": ["États-Unis"], "langue": "anglais", "tags": ["super-héros", "mutants"]}'),
 ('X-Men : Days of Future Past',          '{"duree": 132, "pays": ["États-Unis"], "langue": "anglais", "tags": ["super-héros", "mutants", "voyage dans le temps"]}'),
 ('X-Men : Apocalypse',                   '{"duree": 144, "pays": ["États-Unis"], "langue": "anglais", "tags": ["super-héros", "mutants"]}'),
 ('Forrest Gump',                         '{"duree": 142, "pays": ["États-Unis"], "langue": "anglais", "tags": ["destin", "histoire américaine"], "oscar_meilleur_film": true}'),
 ('Seul au monde',                        '{"duree": 143, "pays": ["États-Unis"], "langue": "anglais", "tags": ["survie", "île"]}'),
 ('Il faut sauver le soldat Ryan',        '{"duree": 169, "pays": ["États-Unis"], "langue": "anglais", "tags": ["seconde guerre mondiale"]}'),
 ('Arrête-moi si tu peux',                '{"duree": 141, "pays": ["États-Unis"], "langue": "anglais", "tags": ["histoire vraie", "arnaque"]}'),
 ('Titanic',                              '{"duree": 194, "pays": ["États-Unis"], "langue": "anglais", "tags": ["romance", "naufrage"], "oscar_meilleur_film": true}'),
 ('Inception',                            '{"duree": 148, "pays": ["États-Unis", "Royaume-Uni"], "langue": "anglais", "tags": ["rêves", "braquage"]}'),
 ('Les Infiltrés',                        '{"duree": 151, "pays": ["États-Unis"], "langue": "anglais", "tags": ["mafia", "remake"], "oscar_meilleur_film": true}'),
 ('Once Upon a Time… in Hollywood',       '{"duree": 161, "pays": ["États-Unis"], "langue": "anglais", "tags": ["Hollywood", "années 60"]}'),
 ('Le Loup de Wall Street',               '{"duree": 180, "pays": ["États-Unis"], "langue": "anglais", "tags": ["histoire vraie", "finance"]}'),
 ('Fight Club',                           '{"duree": 139, "pays": ["États-Unis"], "langue": "anglais", "tags": ["culte", "twist"]}'),
 ('Ocean''s Eleven',                      '{"duree": 116, "pays": ["États-Unis"], "langue": "anglais", "tags": ["braquage", "Las Vegas"]}'),
 ('Seven',                                '{"duree": 127, "pays": ["États-Unis"], "langue": "anglais", "tags": ["enquête", "tueur en série", "twist"]}'),
 ('Batman Begins',                        '{"duree": 140, "pays": ["États-Unis", "Royaume-Uni"], "langue": "anglais", "tags": ["super-héros", "Gotham"]}'),
 ('The Dark Knight',                      '{"duree": 152, "pays": ["États-Unis", "Royaume-Uni"], "langue": "anglais", "tags": ["super-héros", "Gotham", "culte"]}'),
 ('The Dark Knight Rises',                '{"duree": 164, "pays": ["États-Unis", "Royaume-Uni"], "langue": "anglais", "tags": ["super-héros", "Gotham"]}'),
 ('Les Évadés',                           '{"duree": 142, "pays": ["États-Unis"], "langue": "anglais", "tags": ["prison", "amitié", "culte"]}'),
 ('Intouchables',                         '{"duree": 112, "pays": ["France"], "langue": "français", "tags": ["histoire vraie", "amitié"]}'),
 ('La Môme',                              '{"duree": 140, "pays": ["France"], "langue": "français", "tags": ["biopic", "musique"]}'),
 ('The Artist',                           '{"duree": 100, "pays": ["France"], "langue": "muet", "tags": ["cinéma muet", "Hollywood"], "oscar_meilleur_film": true}'),
 ('Le Fabuleux Destin d''Amélie Poulain', '{"duree": 122, "pays": ["France"], "langue": "français", "tags": ["Paris", "culte"]}'),
 ('La Haine',                             '{"duree": 98,  "pays": ["France"], "langue": "français", "tags": ["banlieue", "noir et blanc", "culte"]}'),
 ('Retour vers le futur',                 '{"duree": 116, "pays": ["États-Unis"], "langue": "anglais", "tags": ["voyage dans le temps", "culte"]}'),
 ('Retour vers le futur II',              '{"duree": 108, "pays": ["États-Unis"], "langue": "anglais", "tags": ["voyage dans le temps"]}'),
 ('Retour vers le futur III',             '{"duree": 118, "pays": ["États-Unis"], "langue": "anglais", "tags": ["voyage dans le temps", "western"]}')
) AS v(titre, details)
WHERE f.titre = v.titre;

ALTER TABLE films ALTER COLUMN details SET NOT NULL;

-- ---------- Contrôle ----------
SELECT COUNT(*) AS films_avec_fiche,
       COUNT(*) FILTER (WHERE details ? 'oscar_meilleur_film') AS oscarises
FROM films;


--------------------

-- M7.1 Coups de cœur et déceptions

SELECT films.genre,
       COUNT(*) AS nb_notes,
       COUNT(*) FILTER (WHERE notes.note >= 4.5) AS coups_de_coeur,
       COUNT(*) FILTER (WHERE notes.note <= 2.5) AS deceptions
FROM notes
JOIN films ON films.id = notes.film_id
GROUP BY films.genre
ORDER BY nb_notes DESC, films.genre;

-- M7.2 La SF vue par chaque membre

SELECT utilisateurs.pseudo,
       ROUND(AVG(notes.note) FILTER (WHERE films.genre = 'Science-fiction'), 2) AS moyenne_sf,
       ROUND(AVG(notes.note), 2) AS moyenne_globale
FROM utilisateurs
JOIN notes ON notes.utilisateur_id = utilisateurs.id
JOIN films ON films.id = notes.film_id
GROUP BY utilisateurs.id, utilisateurs.pseudo
ORDER BY moyenne_sf DESC NULLS LAST, utilisateurs.pseudo;

-- M7.3 L'activité par trimestre

WITH visionnages AS (
    SELECT films.genre, 'T' || EXTRACT(QUARTER FROM journal.date_visionnage) AS trimestre FROM journal
    JOIN films ON films.id = journal.film_id
    WHERE journal.date_visionnage >= '2026-01-01' AND journal.date_visionnage < '2027-01-01'
)
SELECT CASE WHEN GROUPING(genre) = 1 THEN 'Total' ELSE genre END AS genre,
       CASE WHEN GROUPING(trimestre) = 1 THEN 'Année' ELSE trimestre END AS trimestre,
       COUNT(*) AS visionnages
FROM visionnages
GROUP BY ROLLUP (genre, trimestre)
ORDER BY GROUPING(genre), genre, GROUPING(trimestre), trimestre;

-- M8.1 Les films fleuves

SELECT titre, (details ->> 'duree')::INTEGER AS duree_min FROM films
WHERE (details ->> 'duree')::INTEGER > 150
ORDER BY duree_min DESC;

-- M8.2 Les oscarisés

SELECT films.titre, films.annee, personnes.nom AS realisateur FROM films
JOIN casting ON casting.film_id = films.id AND casting.role = 'realisateur'
JOIN personnes ON personnes.id = casting.personne_id
WHERE films.details @> '{"oscar_meilleur_film": true}'
ORDER BY films.annee;

-- M8.3 Les tags les plus fréquents

SELECT tags.tag, COUNT(*) AS nb_films FROM films
CROSS JOIN LATERAL jsonb_array_elements_text(films.details -> 'tags') AS tags (tag)
GROUP BY tags.tag
ORDER BY nb_films DESC, tags.tag
LIMIT 5;

-- M8.4 Le fil d'activité

SELECT utilisateurs.pseudo, derniers.titre, derniers.date_visionnage FROM utilisateurs
CROSS JOIN LATERAL (
    SELECT films.titre, journal.date_visionnage FROM journal
    JOIN films ON films.id = journal.film_id
    WHERE journal.utilisateur_id = utilisateurs.id
    ORDER BY journal.date_visionnage DESC, journal.id DESC
    LIMIT 2
) AS derniers
ORDER BY utilisateurs.pseudo, derniers.date_visionnage DESC;

-- M9.1 La fiche film

CREATE VIEW v_fiche_film AS
SELECT films.id,
       films.titre,
       films.annee,
       films.genre,
       (SELECT STRING_AGG(personnes.nom, ', ' ORDER BY personnes.nom) FROM casting
        JOIN personnes ON personnes.id = casting.personne_id
        WHERE casting.film_id = films.id AND casting.role = 'realisateur') AS realisateurs,
       (films.details ->> 'duree')::INTEGER AS duree_min,
       (SELECT COUNT(*) FROM notes WHERE notes.film_id = films.id) AS nb_notes,
       (SELECT ROUND(AVG(notes.note), 2) FROM notes WHERE notes.film_id = films.id) AS moyenne
FROM films;

SELECT titre, annee, realisateurs, duree_min, nb_notes, moyenne FROM v_fiche_film
WHERE genre = 'Science-fiction'
ORDER BY moyenne DESC, titre;

-- M9.2 Le cache des statistiques

CREATE MATERIALIZED VIEW mv_stats_films AS
SELECT films.id AS film_id, films.titre, COUNT(notes.film_id) AS nb_notes, ROUND(AVG(notes.note), 2) AS moyenne
FROM films
LEFT JOIN notes ON notes.film_id = films.id
GROUP BY films.id, films.titre;

CREATE UNIQUE INDEX ON mv_stats_films (film_id);

INSERT INTO notes (utilisateur_id, film_id, note, note_le)
SELECT utilisateurs.id, films.id, 2, CURRENT_DATE FROM utilisateurs
CROSS JOIN films
WHERE utilisateurs.pseudo = 'sofa_critic' AND films.titre = 'Inception';

SELECT titre, nb_notes, moyenne FROM mv_stats_films WHERE titre = 'Inception';

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats_films;

SELECT titre, nb_notes, moyenne FROM mv_stats_films WHERE titre = 'Inception';

-- M9.3 La vitrine science-fiction

CREATE VIEW v_films_sf AS
SELECT id, titre, annee, genre, saga_id, film_precedent_id, details FROM films
WHERE genre = 'Science-fiction'
WITH CHECK OPTION;

UPDATE v_films_sf SET genre = 'Action' WHERE titre = 'Inception';

-- M10.1 Une durée lisible

CREATE FUNCTION duree_texte(minutes INTEGER) RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
    SELECT (minutes / 60) || ' h ' || LPAD((minutes % 60)::TEXT, 2, '0')
$$;

SELECT titre, duree_texte((details ->> 'duree')::INTEGER) AS duree FROM films
ORDER BY (details ->> 'duree')::INTEGER DESC
LIMIT 3;

-- M10.2 La note pondérée

CREATE FUNCTION note_ponderee(film_id INTEGER, m INTEGER DEFAULT 5) RETURNS NUMERIC
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    nb_notes        INTEGER;
    moyenne_film    NUMERIC;
    moyenne_globale NUMERIC;
BEGIN
    SELECT COUNT(*), AVG(note) INTO nb_notes, moyenne_film FROM notes
    WHERE notes.film_id = note_ponderee.film_id;

    IF nb_notes = 0 THEN
        RAISE EXCEPTION 'Le film % n''a aucune note', film_id;
    END IF;

    SELECT AVG(note) INTO moyenne_globale FROM notes;

    RETURN (nb_notes * moyenne_film + m * moyenne_globale) / (nb_notes + m);
END;
$$;

WITH stats AS (
    SELECT films.titre,
           COUNT(*) AS nb_notes,
           ROUND(AVG(notes.note), 2) AS moyenne,
           ROUND(note_ponderee(films.id), 2) AS note_ponderee
    FROM films
    JOIN notes ON notes.film_id = films.id
    GROUP BY films.id, films.titre
),
classement AS (
    SELECT titre, nb_notes, moyenne,
           RANK() OVER (ORDER BY moyenne DESC) AS rang_brut,
           note_ponderee,
           RANK() OVER (ORDER BY note_ponderee DESC) AS rang_pondere
    FROM stats
)
SELECT titre, nb_notes, moyenne, rang_brut, note_ponderee, rang_pondere FROM classement
WHERE rang_pondere <= 5
ORDER BY rang_pondere, nb_notes DESC;

-- M10.3 La compatibilité cinéphile

CREATE FUNCTION compatibilite(pseudo_a TEXT, pseudo_b TEXT)
RETURNS TABLE (titre VARCHAR, note_a NUMERIC, note_b NUMERIC, ecart NUMERIC)
LANGUAGE sql STABLE
AS $$
    SELECT films.titre, notes_a.note, notes_b.note, ABS(notes_a.note - notes_b.note)
    FROM notes AS notes_a
    JOIN notes AS notes_b ON notes_b.film_id = notes_a.film_id
    JOIN films ON films.id = notes_a.film_id
    WHERE notes_a.utilisateur_id = (SELECT id FROM utilisateurs WHERE pseudo = pseudo_a)
      AND notes_b.utilisateur_id = (SELECT id FROM utilisateurs WHERE pseudo = pseudo_b)
$$;

SELECT titre, note_a, note_b, ecart FROM compatibilite('cinephile_92', 'nolanfan')
ORDER BY ecart DESC, titre
LIMIT 5;

SELECT COUNT(*) AS films_communs, ROUND(AVG(ecart), 2) AS ecart_moyen
FROM compatibilite('cinephile_92', 'nolanfan');

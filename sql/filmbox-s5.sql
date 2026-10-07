-- =====================================================================
--  FilmBox — complément séance 5
--  À exécuter sur la base filmbox avec le compte postgres,
--  APRÈS filmbox.sql et filmbox-s2.sql.
--  Ajoute un compteur de vues aux films et un statut privé aux entrées du journal.
--  Script ré-exécutable : il supprime le rôle, les politiques et la fonction
--  créés pendant les missions M15 et M16.
-- =====================================================================

-- Politiques et fonction des missions
ALTER TABLE journal DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS journal_lecture ON journal;
DROP POLICY IF EXISTS journal_ecriture ON journal;
DROP FUNCTION IF EXISTS rechercher_films(TEXT);

-- Rôle de l'application (les rôles existent pour tout le serveur)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'filmbox_app') THEN
        DROP OWNED BY filmbox_app;
        DROP ROLE filmbox_app;
    END IF;
END $$;

-- Compteur de vues des fiches films
ALTER TABLE films DROP COLUMN IF EXISTS nb_vues;
ALTER TABLE films ADD COLUMN nb_vues INTEGER NOT NULL DEFAULT 0;

-- Entrées de journal privées (environ une sur quatre)
ALTER TABLE journal DROP COLUMN IF EXISTS prive;
ALTER TABLE journal ADD COLUMN prive BOOLEAN NOT NULL DEFAULT false;
UPDATE journal SET prive = true WHERE id % 4 = 0;

SELECT COUNT(*) AS entrees_journal,
       COUNT(*) FILTER (WHERE prive) AS entrees_privees
FROM journal;


--------------------

-- M15.1 Les vues perdues (deux consoles A et B, dans l'ordre des étapes)

BEGIN;                                                       -- 1 · A
SELECT nb_vues FROM films WHERE titre = 'Inception';         -- 2 · A
BEGIN;                                                       -- 3 · B
SELECT nb_vues FROM films WHERE titre = 'Inception';         -- 4 · B
UPDATE films SET nb_vues = 1 WHERE titre = 'Inception';      -- 5 · A
COMMIT;                                                      -- 6 · A
UPDATE films SET nb_vues = 1 WHERE titre = 'Inception';      -- 7 · B
COMMIT;                                                      -- 8 · B
SELECT nb_vues FROM films WHERE titre = 'Inception';         -- 9 · A

-- M15.2 Des vues qui s'additionnent (deux consoles A et B, dans l'ordre des étapes)

BEGIN;                                                               -- 1 · A
UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = 'Inception';    -- 2 · A
BEGIN;                                                               -- 3 · B
UPDATE films SET nb_vues = nb_vues + 1 WHERE titre = 'Inception';    -- 4 · B (bloqué)
COMMIT;                                                              -- 5 · A (B se débloque)
COMMIT;                                                              -- 7 · B
SELECT nb_vues FROM films WHERE titre = 'Inception';                 -- 8 · A

-- M15.3 La soirée cinéma

SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = 5;

BEGIN;
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 12, '2026-09-25');
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 20, '2026-09-25');
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (5, 99999, '2026-09-25');
ROLLBACK;

SELECT COUNT(*) AS visionnages FROM journal WHERE utilisateur_id = 5;

-- M16.1 Le compte de l'application

CREATE ROLE filmbox_app LOGIN;
GRANT SELECT ON films, utilisateurs, notes, journal TO filmbox_app;
GRANT INSERT, UPDATE ON notes, journal TO filmbox_app;

SET ROLE filmbox_app;
DELETE FROM notes WHERE film_id = 12;
UPDATE films SET titre = 'Inception 2' WHERE titre = 'Inception';
RESET ROLE;

-- M16.2 Le journal privé

ALTER TABLE journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_lecture ON journal
FOR SELECT
USING (NOT prive OR utilisateur_id = current_setting('app.membre_id', true)::INTEGER);

CREATE POLICY journal_ecriture ON journal
FOR ALL
USING (utilisateur_id = current_setting('app.membre_id', true)::INTEGER)
WITH CHECK (utilisateur_id = current_setting('app.membre_id', true)::INTEGER);

SET ROLE filmbox_app;
SET app.membre_id = '5';
SELECT COUNT(*) FILTER (WHERE prive AND utilisateur_id = 5)  AS mes_entrees_privees,
       COUNT(*) FILTER (WHERE prive AND utilisateur_id <> 5) AS privees_des_autres
FROM journal;
INSERT INTO journal (utilisateur_id, film_id, date_visionnage) VALUES (3, 12, '2026-09-25');
RESET ROLE;

-- M16.3 Une recherche à l'abri des injections

CREATE FUNCTION rechercher_films(p_texte TEXT)
RETURNS TABLE (titre VARCHAR, annee INTEGER)
LANGUAGE sql STABLE
AS $$
    SELECT films.titre, films.annee FROM films
    WHERE films.titre ILIKE '%' || p_texte || '%'
    ORDER BY films.titre
    LIMIT 5
$$;

SELECT * FROM rechercher_films('dark');

SELECT * FROM rechercher_films($$x' OR '1'='1$$);

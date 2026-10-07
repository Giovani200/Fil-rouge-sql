-- =====================================================================
--  FilmBox — complément séance 4
--  À exécuter sur la base filmbox, APRÈS filmbox.sql et filmbox-s2.sql.
--  (Inutile de recharger le volume de la séance 3.)
--  Crée les tables alimentées par les procédures et triggers des missions M13 et M14,
--  et supprime ce qui a été créé lors d'une exécution précédente.
-- =====================================================================

DROP TABLE IF EXISTS films_stats, audit_notes CASCADE;
DROP PROCEDURE IF EXISTS noter(TEXT, TEXT, NUMERIC, NUMERIC), recalculer_stats(INTEGER);
DROP FUNCTION IF EXISTS trg_films_stats(), trg_audit_notes() CASCADE;

CREATE TABLE films_stats (                       -- statistiques dénormalisées, pour un affichage rapide
    film_id   INTEGER PRIMARY KEY REFERENCES films(id),
    nb_notes  INTEGER      NOT NULL,
    moyenne   NUMERIC(3,2) NOT NULL
);

CREATE TABLE audit_notes (                       -- historique des notes modifiées
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    utilisateur_id  INTEGER      NOT NULL,
    film_id         INTEGER      NOT NULL,
    ancienne        NUMERIC(2,1),
    nouvelle        NUMERIC(2,1),
    le              TIMESTAMP    NOT NULL DEFAULT now()
);

SELECT 'films_stats' AS table_name, COUNT(*) AS lignes FROM films_stats
UNION ALL SELECT 'audit_notes', COUNT(*) FROM audit_notes;


--------------------

-- M13.1 La procédure noter

CREATE PROCEDURE noter(p_pseudo TEXT, p_titre TEXT, p_note NUMERIC, INOUT p_moyenne NUMERIC DEFAULT NULL)
LANGUAGE plpgsql
AS $$
DECLARE
    v_utilisateur_id INTEGER;
    v_film_id        INTEGER;
BEGIN
    IF p_note IS NULL OR p_note NOT BETWEEN 0.5 AND 5 OR MOD(p_note, 0.5) <> 0 THEN
        RAISE EXCEPTION 'Note invalide : % (de 0,5 à 5, par demi-point)', p_note;
    END IF;

    SELECT id INTO v_utilisateur_id FROM utilisateurs WHERE pseudo = p_pseudo;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membre inconnu : %', p_pseudo;
    END IF;

    SELECT id INTO v_film_id FROM films WHERE titre = p_titre;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Film inconnu : %', p_titre;
    END IF;

    INSERT INTO notes (utilisateur_id, film_id, note, note_le)
    VALUES (v_utilisateur_id, v_film_id, p_note, CURRENT_DATE)
    ON CONFLICT (utilisateur_id, film_id) DO UPDATE SET note = EXCLUDED.note, note_le = EXCLUDED.note_le;

    INSERT INTO journal (utilisateur_id, film_id, date_visionnage)
    VALUES (v_utilisateur_id, v_film_id, CURRENT_DATE);

    SELECT ROUND(AVG(note), 2) INTO p_moyenne FROM notes WHERE film_id = v_film_id;
END;
$$;

CALL noter('lea.reel', 'Inception', 3.5);

-- M13.2 Les erreurs de saisie

CALL noter('lea.reel', 'Inception', 6);

CALL noter('lea.reel', 'Avatar', 4);

-- M13.3 Initialiser les statistiques par lots

CREATE PROCEDURE recalculer_stats(p_lot INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_film_id INTEGER;
    v_traites INTEGER := 0;
BEGIN
    FOR v_film_id IN SELECT id FROM films ORDER BY id LOOP
        DELETE FROM films_stats WHERE film_id = v_film_id;
        INSERT INTO films_stats (film_id, nb_notes, moyenne)
        SELECT film_id, COUNT(*), ROUND(AVG(note), 2) FROM notes
        WHERE film_id = v_film_id
        GROUP BY film_id;

        v_traites := v_traites + 1;
        IF v_traites % p_lot = 0 THEN
            COMMIT;
            RAISE NOTICE '% films traités', v_traites;
        END IF;
    END LOOP;
    COMMIT;
END;
$$;

CALL recalculer_stats(10);

SELECT COUNT(*) AS films_avec_stats FROM films_stats;

-- M14.1 Des statistiques maintenues

CREATE FUNCTION trg_films_stats() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_film_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_film_id := OLD.film_id;
    ELSE
        v_film_id := NEW.film_id;
    END IF;

    DELETE FROM films_stats WHERE film_id = v_film_id;
    INSERT INTO films_stats (film_id, nb_notes, moyenne)
    SELECT film_id, COUNT(*), ROUND(AVG(note), 2) FROM notes
    WHERE film_id = v_film_id
    GROUP BY film_id;

    RETURN NULL;
END;
$$;

CREATE TRIGGER maj_films_stats
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW EXECUTE FUNCTION trg_films_stats();

SELECT films.titre, films_stats.nb_notes, films_stats.moyenne FROM films_stats
JOIN films ON films.id = films_stats.film_id
WHERE films.titre = 'The Artist';

CALL noter('bobine', 'The Artist', 5);

SELECT films.titre, films_stats.nb_notes, films_stats.moyenne FROM films_stats
JOIN films ON films.id = films_stats.film_id
WHERE films.titre = 'The Artist';

-- M14.2 Tracer les changements d'avis

CREATE FUNCTION trg_audit_notes() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO audit_notes (utilisateur_id, film_id, ancienne, nouvelle)
    VALUES (OLD.utilisateur_id, OLD.film_id, OLD.note, NEW.note);
    RETURN NULL;
END;
$$;

CREATE TRIGGER audit_changement_note
AFTER UPDATE ON notes
FOR EACH ROW
WHEN (OLD.note IS DISTINCT FROM NEW.note)
EXECUTE FUNCTION trg_audit_notes();

CALL noter('lea.reel', 'Inception', 4.5);
CALL noter('lea.reel', 'Inception', 4.5);

SELECT utilisateurs.pseudo, films.titre, audit_notes.ancienne, audit_notes.nouvelle FROM audit_notes
JOIN utilisateurs ON utilisateurs.id = audit_notes.utilisateur_id
JOIN films ON films.id = audit_notes.film_id
ORDER BY audit_notes.id;

-- M14.3 Le contrôle de cohérence

SELECT COUNT(*) AS films_incoherents FROM films_stats
FULL JOIN (
    SELECT film_id, COUNT(*) AS nb_notes, ROUND(AVG(note), 2) AS moyenne FROM notes
    GROUP BY film_id
) AS calcul ON calcul.film_id = films_stats.film_id
WHERE films_stats.nb_notes IS DISTINCT FROM calcul.nb_notes
   OR films_stats.moyenne IS DISTINCT FROM calcul.moyenne;

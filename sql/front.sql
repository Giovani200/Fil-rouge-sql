-- =====================================================================
--  FilmBox — complément pour le front
--  À exécuter APRÈS filmbox.sql, filmbox-s2.sql, filmbox-s4.sql et filmbox-s5.sql,
--  avec psql et la variable mot_de_passe (voir init-db.sh).
--  Donne à filmbox_app les lectures dont les pages ont besoin sans affaiblir M16.1,
--  et fait écrire les triggers de M14 avec les droits de leur propriétaire.
-- =====================================================================

GRANT SELECT ON v_fiche_film, films_stats, sagas, personnes, casting TO filmbox_app;
GRANT UPDATE (nb_vues) ON films TO filmbox_app;

ALTER FUNCTION trg_films_stats() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION trg_audit_notes() SECURITY DEFINER SET search_path = public;

ALTER ROLE filmbox_app PASSWORD :'mot_de_passe';

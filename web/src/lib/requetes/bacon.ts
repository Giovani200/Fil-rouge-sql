import type { PoolClient } from "pg";
import { lignes, premiereLigne, type Requete } from "@/lib/requete";

const ACTEURS: Requete = {
  mission: "Acteurs du casting",
  sql: `
SELECT DISTINCT personnes.nom FROM personnes
JOIN casting ON casting.personne_id = personnes.id
WHERE casting.role = 'acteur'
ORDER BY personnes.nom`.trim(),
};

export const CHEMIN_BACON: Requete = {
  mission: "M4.4 · CTE récursive sur le graphe des acteurs, sans repasser par le même acteur",
  sql: `
WITH RECURSIVE chemins AS (
    SELECT id AS acteur_id, 0 AS degre, nom::TEXT AS chemin, ARRAY[id] AS visites FROM personnes
    WHERE nom = 'Kevin Bacon'
    UNION ALL
    SELECT partenaire.id,
           chemins.degre + 1,
           chemins.chemin || ' — ' || films.titre || ' — ' || partenaire.nom,
           chemins.visites || partenaire.id
    FROM chemins
    JOIN casting AS casting_acteur ON casting_acteur.personne_id = chemins.acteur_id AND casting_acteur.role = 'acteur'
    JOIN casting AS casting_partenaire ON casting_partenaire.film_id = casting_acteur.film_id AND casting_partenaire.role = 'acteur'
    JOIN films ON films.id = casting_acteur.film_id
    JOIN personnes AS partenaire ON partenaire.id = casting_partenaire.personne_id
    WHERE partenaire.id <> ALL (chemins.visites)
      AND chemins.degre < 4
)
SELECT chemins.degre, chemins.chemin FROM chemins
JOIN personnes ON personnes.id = chemins.acteur_id
WHERE personnes.nom = $1
ORDER BY chemins.degre, chemins.chemin
LIMIT 1`.trim(),
};

/** Chemin vers Kevin Bacon : `etapes` alterne acteur, film, acteur… en partant de Kevin Bacon. */
export type CheminBacon = { degre: number; etapes: string[] };

export async function acteurs(client: PoolClient): Promise<string[]> {
  return (await lignes<{ nom: string }>(client, ACTEURS)).map((ligne) => ligne.nom);
}

export async function cheminBacon(client: PoolClient, acteur: string): Promise<CheminBacon | null> {
  const resultat = await premiereLigne<{ degre: number; chemin: string }>(client, CHEMIN_BACON, [acteur]);
  return resultat && { degre: resultat.degre, etapes: resultat.chemin.split(" — ") };
}

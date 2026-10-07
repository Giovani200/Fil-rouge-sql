import type { PoolClient } from "pg";

/** Une requête du fil rouge : son SQL et la mission du cours dont elle vient (affichés dans le panneau « Voir le SQL »). */
export type Requete = { mission: string; sql: string };

export async function lignes<T>(client: PoolClient, requete: Requete, parametres: unknown[] = []): Promise<T[]> {
  const resultat = await client.query(requete.sql, parametres);
  return resultat.rows as T[];
}

export async function premiereLigne<T>(client: PoolClient, requete: Requete, parametres: unknown[] = []): Promise<T | null> {
  const [ligne] = await lignes<T>(client, requete, parametres);
  return ligne ?? null;
}

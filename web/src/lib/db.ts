import { Pool, types, type PoolClient } from "pg";

types.setTypeParser(types.builtins.INT8, Number);
types.setTypeParser(types.builtins.NUMERIC, Number);
types.setTypeParser(types.builtins.DATE, (valeur) => valeur);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type Travail<T> = (client: PoolClient) => Promise<T>;

/**
 * Exécute `travail` dans une transaction où `app.membre_id` vaut `membreId`,
 * pour que les politiques RLS du journal (M16.2) s'appliquent au bon membre.
 *
 * Le réglage est local à la transaction : il ne fuit pas vers la requête suivante
 * qui réutilisera la connexion. Il est toujours renseigné, car une valeur vide
 * ferait échouer le `::INTEGER` des politiques. Avec `annuler`, la transaction
 * se termine par un ROLLBACK (utilisé par les tests).
 */
export async function avecMembre<T>(
  membreId: number,
  travail: Travail<T>,
  { annuler = false }: { annuler?: boolean } = {},
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.membre_id', $1, true)", [String(membreId)]);
    const resultat = await travail(client);
    await client.query(annuler ? "ROLLBACK" : "COMMIT");
    return resultat;
  } catch (erreur) {
    await client.query("ROLLBACK");
    throw erreur;
  } finally {
    client.release();
  }
}

export function fermerPool(): Promise<void> {
  return pool.end();
}

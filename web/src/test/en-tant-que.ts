import { avecMembre, type Travail } from "@/lib/db";

/**
 * Exécute `travail` comme le membre `membreId`, puis annule la transaction.
 * Les tests laissent ainsi la base telle que `init-db.sh` l'a créée :
 * les valeurs attendues ci-dessous supposent une base fraîchement recréée.
 */
export function enTantQue<T>(membreId: number, travail: Travail<T>): Promise<T> {
  return avecMembre(membreId, travail, { annuler: true });
}

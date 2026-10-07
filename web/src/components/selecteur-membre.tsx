import { avecMembre } from "@/lib/db";
import { membreConnecte } from "@/lib/membre";
import { listeMembres } from "@/lib/requetes/membres";
import { ChoixMembre } from "./choix-membre";

export async function SelecteurMembre() {
  const membreId = await membreConnecte();
  const membres = await avecMembre(membreId, listeMembres);
  return <ChoixMembre membres={membres.map(({ id, pseudo }) => ({ id, pseudo }))} membreId={membreId} />;
}

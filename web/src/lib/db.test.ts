import { describe, expect, it } from "vitest";
import { avecMembre } from "@/lib/db";
import { VISITEUR } from "@/lib/visiteur";
import { enTantQue } from "@/test/en-tant-que";

const ENTREES_PRIVEES = "SELECT COUNT(*) FILTER (WHERE prive) AS privees FROM journal";
const VUES_INCEPTION = "SELECT nb_vues FROM films WHERE id = 12";

describe("avecMembre", () => {
  it("applique la RLS du membre connecté : lea.reel voit ses entrées privées", async () => {
    const { rows } = await enTantQue(5, (client) => client.query(ENTREES_PRIVEES));
    expect(rows[0].privees).toBe(11);
  });

  it("ne montre aucune entrée privée au visiteur, même sur une connexion déjà utilisée par un membre", async () => {
    await enTantQue(5, (client) => client.query("SELECT 1"));
    const { rows } = await enTantQue(VISITEUR, (client) => client.query(ENTREES_PRIVEES));
    expect(rows[0].privees).toBe(0);
  });

  it("annule la transaction quand on le demande", async () => {
    const avant = await enTantQue(VISITEUR, (client) => client.query(VUES_INCEPTION));
    await enTantQue(VISITEUR, (client) => client.query("UPDATE films SET nb_vues = nb_vues + 1 WHERE id = 12"));
    const apres = await avecMembre(VISITEUR, (client) => client.query(VUES_INCEPTION));
    expect(apres.rows[0].nb_vues).toBe(avant.rows[0].nb_vues);
  });
});

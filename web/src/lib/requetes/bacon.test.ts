import { describe, expect, it } from "vitest";
import { VISITEUR } from "@/lib/visiteur";
import { enTantQue } from "@/test/en-tant-que";
import { acteurs, cheminBacon } from "./bacon";

describe("Kevin Bacon (M4.4)", () => {
  it("liste les 53 acteurs du casting", async () => {
    const noms = await enTantQue(VISITEUR, acteurs);
    expect(noms).toHaveLength(53);
    expect(noms).toContain("Kevin Bacon");
  });

  it("trouve le chemin le plus court jusqu'à Kevin Bacon, découpé en étapes", async () => {
    expect(await enTantQue(VISITEUR, (client) => cheminBacon(client, "Omar Sy"))).toEqual({
      degre: 2,
      etapes: ["Kevin Bacon", "X-Men : Le Commencement", "James McAvoy", "X-Men : Days of Future Past", "Omar Sy"],
    });
    expect(await enTantQue(VISITEUR, (client) => cheminBacon(client, "Kevin Bacon"))).toEqual({ degre: 0, etapes: ["Kevin Bacon"] });
  });

  it("renvoie null pour un acteur que rien ne relie à Kevin Bacon en 4 films", async () => {
    expect(await enTantQue(VISITEUR, (client) => cheminBacon(client, "Audrey Tautou"))).toBeNull();
  });
});

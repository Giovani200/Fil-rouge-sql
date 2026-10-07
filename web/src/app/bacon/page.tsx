import { PanneauSql } from "@/components/panneau-sql";
import { TitrePage } from "@/components/titre-page";
import { avecMembre } from "@/lib/db";
import { premierParametre } from "@/lib/parametres";
import { CHEMIN_BACON, acteurs, cheminBacon } from "@/lib/requetes/bacon";
import { VISITEUR } from "@/lib/visiteur";

export const metadata = { title: "Kevin Bacon" };

export default async function Bacon({ searchParams }: PageProps<"/bacon">) {
  const acteur = premierParametre((await searchParams).acteur);
  const { noms, chemin } = await avecMembre(VISITEUR, async (client) => ({
    noms: await acteurs(client),
    chemin: acteur ? await cheminBacon(client, acteur) : null,
  }));

  return (
    <>
      <TitrePage surtitre="Six degrés de séparation" titre="Le nombre de Kevin Bacon">
        Tout acteur serait relié à Kevin Bacon en quelques films. Une CTE récursive parcourt le graphe des acteurs qui
        ont tourné ensemble, sans jamais repasser par le même acteur.
      </TitrePage>

      <form className="flex flex-wrap gap-3">
        <select
          name="acteur"
          defaultValue={acteur ?? "Omar Sy"}
          className="min-w-64 rounded-full border border-bordure bg-surface px-4 py-2.5 focus:border-ambre focus:outline-none"
        >
          {noms.map((nom) => (
            <option key={nom} value={nom}>
              {nom}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-ambre px-6 py-2.5 font-medium text-fond transition hover:brightness-110">
          Trouver le chemin
        </button>
      </form>

      {acteur && (
        <div className="mt-10 rounded-2xl border border-bordure bg-surface p-8">
          {chemin ? (
            <>
              <p className="text-attenue">
                Nombre de Bacon de <span className="text-texte">{acteur}</span>
              </p>
              <p className="font-titre text-7xl text-ambre">{chemin.degre}</p>
              <ol className="mt-6 flex flex-wrap items-center gap-2">
                {chemin.etapes.map((etape, position) =>
                  position % 2 === 0 ? (
                    <li key={position} className="rounded-full bg-surface-haute px-4 py-2 font-medium">
                      {etape}
                    </li>
                  ) : (
                    <li key={position} className="px-1 text-sm text-attenue italic">
                      — {etape} —
                    </li>
                  ),
                )}
              </ol>
            </>
          ) : (
            <p className="text-attenue">
              Aucun chemin d&apos;au plus 4 films ne relie <span className="text-texte">{acteur}</span> à Kevin Bacon : il
              fait partie des « inaccessibles » de M4.5.
            </p>
          )}
        </div>
      )}

      <div className="mt-8">
        <PanneauSql requete={CHEMIN_BACON} />
      </div>
    </>
  );
}

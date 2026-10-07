import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PanneauSql } from "@/components/panneau-sql";
import { TitrePage } from "@/components/titre-page";
import { avecMembre } from "@/lib/db";
import { LISTE_MEMBRES, listeMembres } from "@/lib/requetes/membres";
import { VISITEUR } from "@/lib/visiteur";

export const metadata = { title: "Membres" };

export default async function Membres() {
  const membres = await avecMembre(VISITEUR, listeMembres);

  return (
    <>
      <TitrePage surtitre="Membres" titre="Les cinéphiles de FilmBox">
        Ouvre un profil, puis change de membre en haut de la page : les entrées privées du journal apparaissent ou
        disparaissent selon qui regarde.
      </TitrePage>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {membres.map((membre) => (
          <Link
            key={membre.id}
            href={`/membres/${encodeURIComponent(membre.pseudo)}`}
            className="flex items-center gap-4 rounded-2xl border border-bordure bg-surface p-5 transition hover:border-ambre/60"
          >
            <Avatar id={membre.id} pseudo={membre.pseudo} />
            <div>
              <p className="font-medium">{membre.pseudo}</p>
              <p className="text-sm text-attenue">
                {membre.ville} · {membre.nb_notes} notes
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <PanneauSql requete={LISTE_MEMBRES} />
      </div>
    </>
  );
}

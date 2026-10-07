import Link from "next/link";
import { notFound } from "next/navigation";
import { Affiche } from "@/components/affiche";
import { Etoiles } from "@/components/etoiles";
import { PanneauSql } from "@/components/panneau-sql";
import { Section } from "@/components/section";
import { avecMembre } from "@/lib/db";
import { formaterDate, formaterMoyenne, formaterNote } from "@/lib/format";
import { membreConnecte } from "@/lib/membre";
import { entierPositif } from "@/lib/parametres";
import {
  DISTRIBUTION,
  EVOLUTION,
  FICHE,
  INCREMENTER_VUES,
  NOTER,
  SAGA,
  distribution,
  evolution,
  fiche,
  maNote,
  saga,
} from "@/lib/requetes/films";
import { VISITEUR } from "@/lib/visiteur";
import { CompteurVues } from "./compteur-vues";
import { FormulaireNote } from "./formulaire-note";

export default async function PageFilm({ params }: PageProps<"/films/[id]">) {
  const id = entierPositif((await params).id);
  if (id === null) notFound();

  const membreId = await membreConnecte();
  const donnees = await avecMembre(membreId, async (client) => {
    const film = await fiche(client, id);
    if (!film) return null;
    return {
      film,
      acteurs: await distribution(client, id),
      episodes: await saga(client, id),
      points: await evolution(client, id),
      noteActuelle: await maNote(client, id, membreId),
    };
  });
  if (!donnees) notFound();
  const { film, acteurs, episodes, points, noteActuelle } = donnees;

  return (
    <>
      <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
        <div className="max-w-64">
          <Affiche id={film.id} titre={film.titre} annee={film.annee} grande />
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-ambre uppercase">
            {film.genre} · {film.annee}
          </p>
          <h1 className="mt-2 font-titre text-4xl font-semibold tracking-tight sm:text-5xl">{film.titre}</h1>
          <p className="mt-3 text-attenue">
            Réalisé par <span className="text-texte">{film.realisateurs ?? "—"}</span> · {film.duree} ·{" "}
            {film.pays.join(", ")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {film.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-bordure px-3 py-1 text-xs text-attenue">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-bordure bg-surface p-5">
              <p className="text-sm text-attenue">Moyenne · {film.nb_notes ?? 0} notes</p>
              <p className="mt-1 font-titre text-3xl">{formaterMoyenne(film.moyenne)}</p>
              <Etoiles note={film.moyenne} />
            </div>
            <div className="rounded-2xl border border-bordure bg-surface p-5">
              <p className="text-sm text-attenue">Note pondérée (IMDb)</p>
              <p className="mt-1 font-titre text-3xl">{formaterMoyenne(film.note_ponderee)}</p>
              <p className="text-xs text-attenue">tirée vers la moyenne générale quand il y a peu de notes</p>
            </div>
            <div className="rounded-2xl border border-bordure bg-surface p-5">
              <p className="text-sm text-attenue">Consultations</p>
              <CompteurVues filmId={film.id} vuesInitiales={film.nb_vues} />
            </div>
          </div>

          <div className="mt-4">
            {membreId === VISITEUR ? (
              <p className="rounded-2xl border border-dashed border-bordure p-5 text-sm text-attenue">
                Choisis un membre en haut de la page pour noter ce film.
              </p>
            ) : (
              <FormulaireNote titre={film.titre} noteActuelle={noteActuelle} />
            )}
          </div>

          <PanneauSql requete={FICHE} />
          <PanneauSql requete={NOTER} />
          <PanneauSql requete={INCREMENTER_VUES} />
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Section titre="Distribution" requetes={[DISTRIBUTION]} className={episodes.length === 0 ? "md:col-span-2" : ""}>
          <ul className="flex flex-wrap gap-2">
            {acteurs.map((acteur) => (
              <li key={acteur}>
                <Link
                  href={`/bacon?acteur=${encodeURIComponent(acteur)}`}
                  className="block rounded-full bg-surface-haute px-3 py-1.5 text-sm transition hover:text-ambre"
                >
                  {acteur}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-attenue">Un clic sur un acteur montre son chemin jusqu&apos;à Kevin Bacon.</p>
        </Section>

        {episodes.length > 0 && (
          <Section titre={`Saga ${episodes[0].saga}`} requetes={[SAGA]}>
            <ol className="space-y-2">
              {episodes.map((episode) => (
                <li key={episode.id} className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-surface-haute text-xs text-ambre">
                    {episode.episode}
                  </span>
                  {episode.id === film.id ? (
                    <span className="font-medium">{episode.titre}</span>
                  ) : (
                    <Link href={`/films/${episode.id}`} className="hover:text-ambre">
                      {episode.titre}
                    </Link>
                  )}
                  <span className="text-sm text-attenue">{episode.annee}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <Section titre="Évolution de la note" requetes={[EVOLUTION]} className="md:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-attenue">
              <tr>
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Membre</th>
                <th className="pb-2 font-normal">Note</th>
                <th className="pb-2 text-right font-normal">Moyenne cumulée</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={`${point.pseudo}-${point.note_le}`} className="border-t border-bordure">
                  <td className="py-2 text-attenue">{formaterDate(point.note_le)}</td>
                  <td className="py-2">
                    <Link href={`/membres/${encodeURIComponent(point.pseudo)}`} className="hover:text-ambre">
                      {point.pseudo}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Etoiles note={point.note} taille="text-sm" /> <span className="ml-1 text-attenue">{formaterNote(point.note)}</span>
                  </td>
                  <td className="py-2 text-right font-medium">{formaterMoyenne(point.moyenne_cumulee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </>
  );
}

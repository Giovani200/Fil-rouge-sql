import Link from "next/link";
import { notFound } from "next/navigation";
import { Affiche } from "@/components/affiche";
import { Avatar } from "@/components/avatar";
import { Etoiles } from "@/components/etoiles";
import { PanneauSql } from "@/components/panneau-sql";
import { Section } from "@/components/section";
import { avecMembre } from "@/lib/db";
import { formaterDate, formaterMois, formaterMoyenne, formaterNote } from "@/lib/format";
import { membreConnecte } from "@/lib/membre";
import { decoderSegment } from "@/lib/parametres";
import {
  A_VOIR_ENSUITE,
  CARTE_PROFIL,
  COMPATIBILITE,
  JOURNAL,
  VISIONNAGES_CUMULES,
  aVoirEnsuite,
  carteProfil,
  compatibilite,
  journalMembre,
  listeMembres,
  visionnagesCumules,
} from "@/lib/requetes/membres";

export default async function PageMembre({ params }: PageProps<"/membres/[pseudo]">) {
  const pseudo = decoderSegment((await params).pseudo);
  if (pseudo === null) notFound();

  const membreId = await membreConnecte();
  const donnees = await avecMembre(membreId, async (client) => {
    const carte = await carteProfil(client, pseudo);
    if (!carte) return null;
    const moi = (await listeMembres(client)).find((membre) => membre.id === membreId);
    return {
      carte,
      journal: await journalMembre(client, pseudo),
      mois: await visionnagesCumules(client, pseudo),
      aVoir: await aVoirEnsuite(client, pseudo),
      compat: moi && moi.id !== carte.id ? { avec: moi.pseudo, films: await compatibilite(client, moi.pseudo, pseudo) } : null,
    };
  });
  if (!donnees) notFound();
  const { carte, journal, mois, aVoir, compat } = donnees;
  const estMoi = carte.id === membreId;
  const cumulMax = mois.at(-1)?.cumul ?? 1;

  return (
    <>
      <div className="flex flex-wrap items-center gap-6">
        <Avatar id={carte.id} pseudo={carte.pseudo} grand />
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-ambre uppercase">
            {estMoi ? "Mon profil" : "Profil"}
          </p>
          <h1 className="mt-1 font-titre text-4xl font-semibold tracking-tight">{carte.pseudo}</h1>
          <p className="mt-1 text-attenue">
            {carte.ville} · membre depuis le {formaterDate(carte.inscrit_le)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5">
          <p className="text-sm text-attenue">Films notés</p>
          <p className="mt-1 font-titre text-3xl">{carte.nb_films_notes}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5">
          <p className="text-sm text-attenue">Note moyenne</p>
          <p className="mt-1 font-titre text-3xl">{formaterMoyenne(carte.note_moyenne)}</p>
          <Etoiles note={carte.note_moyenne} taille="text-sm" />
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5">
          <p className="text-sm text-attenue">Genre préféré</p>
          <p className="mt-1 font-titre text-2xl">{carte.genre_prefere ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5">
          <p className="text-sm text-attenue">Coup de cœur</p>
          {carte.coup_de_coeur_id ? (
            <Link href={`/films/${carte.coup_de_coeur_id}`} className="mt-1 block font-titre text-2xl hover:text-ambre">
              {carte.coup_de_coeur}
            </Link>
          ) : (
            <p className="mt-1 font-titre text-2xl">—</p>
          )}
        </div>
      </div>
      <PanneauSql requete={CARTE_PROFIL} />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Section titre="Journal de visionnage" requetes={[JOURNAL]}>
          <p className="mb-4 rounded-lg bg-surface-haute px-4 py-3 text-sm text-attenue">
            {estMoi
              ? "Tu vois tes entrées privées 🔒 : la RLS les montre à leur auteur, et à lui seul."
              : `Les entrées privées de ${carte.pseudo} n'apparaissent pas : la RLS empêche PostgreSQL de les renvoyer.`}
          </p>
          <ul className="space-y-2 text-sm">
            {journal.map((entree) => (
              <li key={entree.id} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-attenue">{formaterDate(entree.date_visionnage)}</span>
                <Link href={`/films/${entree.film_id}`} className="flex-1 hover:text-ambre">
                  {entree.titre}
                </Link>
                {entree.prive && <span className="rounded-full bg-ambre/15 px-2 py-0.5 text-xs text-ambre">🔒 privé</span>}
              </li>
            ))}
          </ul>
        </Section>

        <div className="space-y-6">
          <Section titre="Visionnages cumulés" requetes={[VISIONNAGES_CUMULES]}>
            <ul className="space-y-1.5 text-sm">
              {mois.map((ligne) => (
                <li key={ligne.mois} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-attenue">{formaterMois(ligne.mois)}</span>
                  <span className="h-2 rounded-full bg-ambre" style={{ width: `${(ligne.cumul / cumulMax) * 100}%` }} />
                  <span className="shrink-0 text-xs text-attenue">{ligne.cumul}</span>
                </li>
              ))}
            </ul>
          </Section>

          {compat ? (
            <Section titre={`Compatibilité avec ${compat.avec}`} requetes={[COMPATIBILITE]}>
              {compat.films.length > 0 ? (
                <>
                  <p className="text-attenue">
                    <span className="font-titre text-3xl text-texte">{compat.films[0].films_communs}</span> films en commun ·
                    écart moyen <span className="text-texte">{formaterMoyenne(compat.films[0].ecart_moyen)}</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {compat.films.slice(0, 6).map((film) => (
                      <li key={film.titre} className="flex justify-between gap-3">
                        <span>{film.titre}</span>
                        <span className="text-attenue">
                          {formaterNote(film.note_a)} / {formaterNote(film.note_b)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-attenue">Aucun film noté en commun.</p>
              )}
            </Section>
          ) : (
            !estMoi && (
              <p className="rounded-2xl border border-dashed border-bordure p-5 text-sm text-attenue">
                Choisis un membre en haut de la page pour voir ta compatibilité avec {carte.pseudo}.
              </p>
            )
          )}
        </div>
      </div>

      <Section titre="À voir ensuite" requetes={[A_VOIR_ENSUITE]} className="mt-6">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {aVoir.map((film) => (
            <Link key={film.id} href={`/films/${film.id}`} className="transition hover:-translate-y-1">
              <Affiche id={film.id} titre={film.titre} annee={film.annee} />
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

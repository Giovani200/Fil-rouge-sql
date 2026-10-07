import Link from "next/link";
import { Section } from "@/components/section";
import { TitrePage } from "@/components/titre-page";
import { avecMembre } from "@/lib/db";
import { formaterMoyenne, formaterNote } from "@/lib/format";
import {
  CLASSEMENT_PONDERE,
  FILMS_QUI_DIVISENT,
  REALISATEURS,
  TOP_3_PAR_GENRE,
  classementPondere,
  filmsQuiDivisent,
  realisateurs,
  top3ParGenre,
} from "@/lib/requetes/classements";
import { VISITEUR } from "@/lib/visiteur";

export const metadata = { title: "Classements" };

export default async function Classements() {
  const { pondere, parGenre, cineastes, divisent } = await avecMembre(VISITEUR, async (client) => ({
    pondere: await classementPondere(client),
    parGenre: Map.groupBy(await top3ParGenre(client), (ligne) => ligne.genre),
    cineastes: await realisateurs(client),
    divisent: await filmsQuiDivisent(client),
  }));

  return (
    <>
      <TitrePage surtitre="Classements" titre="Ce que pensent les membres">
        Un film noté 5 par une seule personne ne doit pas passer devant un film noté 4,6 par vingt membres : la note
        pondérée corrige la moyenne brute.
      </TitrePage>

      <Section titre="Top 10 : note pondérée contre moyenne brute" requetes={[CLASSEMENT_PONDERE]}>
        <table className="w-full text-sm">
          <thead className="text-left text-attenue">
            <tr>
              <th className="pb-2 font-normal">Rang</th>
              <th className="pb-2 font-normal">Film</th>
              <th className="pb-2 text-right font-normal">Notes</th>
              <th className="pb-2 text-right font-normal">Moyenne brute (rang)</th>
              <th className="pb-2 text-right font-normal">Note pondérée</th>
            </tr>
          </thead>
          <tbody>
            {pondere.map((ligne) => (
              <tr key={ligne.id} className="border-t border-bordure">
                <td className="py-2.5 font-titre text-lg text-ambre">{ligne.rang_pondere}</td>
                <td className="py-2.5">
                  <Link href={`/films/${ligne.id}`} className="hover:text-ambre">
                    {ligne.titre}
                  </Link>
                </td>
                <td className="py-2.5 text-right text-attenue">{ligne.nb_notes}</td>
                <td className="py-2.5 text-right text-attenue">
                  {formaterMoyenne(ligne.moyenne)} ({ligne.rang_brut})
                </td>
                <td className="py-2.5 text-right font-medium">{formaterMoyenne(ligne.note_ponderee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section titre="Top 3 par genre" requetes={[TOP_3_PAR_GENRE]} className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...parGenre].map(([genre, films]) => (
            <div key={genre} className="rounded-xl bg-surface-haute p-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-ambre uppercase">{genre}</p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {films.map((film) => (
                  <li key={film.id} className="flex justify-between gap-3">
                    <Link href={`/films/${film.id}`} className="hover:text-ambre">
                      {film.rang}. {film.titre}
                    </Link>
                    <span className="text-attenue">{formaterMoyenne(film.moyenne)}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Section titre="Réalisateurs les mieux notés" requetes={[REALISATEURS]}>
          <ol className="space-y-2 text-sm">
            {cineastes.map((ligne) => (
              <li key={ligne.realisateur} className="flex items-center gap-3">
                <span className="w-6 font-titre text-ambre">{ligne.rang}</span>
                <span className="flex-1">{ligne.realisateur}</span>
                <span className="text-attenue">{ligne.nb_notes} notes</span>
                <span className="w-12 text-right font-medium">{formaterMoyenne(ligne.moyenne)}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section titre="Les films qui divisent" requetes={[FILMS_QUI_DIVISENT]}>
          <ul className="space-y-4 text-sm">
            {divisent.map((film) => (
              <li key={film.id}>
                <div className="flex justify-between">
                  <Link href={`/films/${film.id}`} className="hover:text-ambre">
                    {film.titre}
                  </Link>
                  <span className="text-attenue">
                    de {formaterNote(film.pire)} à {formaterNote(film.meilleure)}
                  </span>
                </div>
                <div className="relative mt-2 h-1.5 rounded-full bg-surface-haute">
                  <div
                    className="absolute h-full rounded-full bg-gradient-to-r from-rouge to-ambre"
                    style={{ left: `${(film.pire / 5) * 100}%`, width: `${(film.ecart / 5) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}

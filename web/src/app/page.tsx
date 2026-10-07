import Link from "next/link";
import { CarteFilm } from "@/components/carte-film";
import { PanneauSql } from "@/components/panneau-sql";
import { TitrePage } from "@/components/titre-page";
import { avecMembre } from "@/lib/db";
import { premierParametre } from "@/lib/parametres";
import { CATALOGUE, RECHERCHE, TAGS_POPULAIRES, catalogue, genres, rechercher, tagsPopulaires } from "@/lib/requetes/films";
import { VISITEUR } from "@/lib/visiteur";

export default async function Catalogue({ searchParams }: PageProps<"/">) {
  const parametres = await searchParams;
  const recherche = premierParametre(parametres.q);
  const genre = premierParametre(parametres.genre);

  const { films, listeGenres, tags } = await avecMembre(VISITEUR, async (client) => ({
    films: recherche ? await rechercher(client, recherche) : await catalogue(client, genre),
    listeGenres: await genres(client),
    tags: await tagsPopulaires(client),
  }));
  const filmsAffiches = recherche && genre ? films.filter((film) => film.genre === genre) : films;

  return (
    <>
      <TitrePage surtitre="FilmBox" titre="Le catalogue">
        Trente films réels, notés par huit membres. Les moyennes viennent de <code>films_stats</code>, que le trigger
        de M14.1 tient à jour à chaque note.
      </TitrePage>

      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={recherche ?? ""}
          placeholder="Rechercher un titre (ex. dark)"
          className="min-w-64 flex-1 rounded-full border border-bordure bg-surface px-5 py-2.5 placeholder:text-attenue focus:border-ambre focus:outline-none"
        />
        <select
          name="genre"
          defaultValue={genre ?? ""}
          className="rounded-full border border-bordure bg-surface px-4 py-2.5 focus:border-ambre focus:outline-none"
        >
          <option value="">Tous les genres</option>
          {listeGenres.map((nom) => (
            <option key={nom} value={nom}>
              {nom}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-ambre px-6 py-2.5 font-medium text-fond transition hover:brightness-110">
          Filtrer
        </button>
        {(recherche || genre) && (
          <Link href="/" className="self-center text-sm text-attenue hover:text-texte">
            Effacer
          </Link>
        )}
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-attenue">Tags les plus fréquents :</span>
        {tags.map(({ tag, nb_films }) => (
          <span key={tag} className="rounded-full border border-bordure px-3 py-1 text-attenue">
            {tag} <span className="text-ambre">{nb_films}</span>
          </span>
        ))}
      </div>

      {recherche && (
        <p className="mt-6 text-sm text-attenue">
          Recherche « {recherche} » avec <code>rechercher_films</code> : 5 résultats au plus, et la saisie n&apos;est
          jamais collée dans le SQL.
        </p>
      )}

      {filmsAffiches.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filmsAffiches.map((film) => (
            <CarteFilm key={film.id} film={film} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-attenue">Aucun film ne correspond.</p>
      )}

      <div className="mt-12">
        <PanneauSql requete={recherche ? RECHERCHE : CATALOGUE} />
        <PanneauSql requete={TAGS_POPULAIRES} />
      </div>
    </>
  );
}

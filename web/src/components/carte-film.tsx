import Link from "next/link";
import { formaterMoyenne } from "@/lib/format";
import type { FilmCatalogue } from "@/lib/requetes/films";
import { Affiche } from "./affiche";
import { Etoiles } from "./etoiles";

export function CarteFilm({ film }: { film: FilmCatalogue }) {
  return (
    <Link href={`/films/${film.id}`} className="group block">
      <div className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-ambre/10">
        <Affiche id={film.id} titre={film.titre} annee={film.annee} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Etoiles note={film.moyenne} taille="text-sm" />
        <span className="text-xs text-attenue">{formaterMoyenne(film.moyenne)}</span>
      </div>
      <p className="mt-1 text-xs text-attenue">{film.genre}</p>
    </Link>
  );
}

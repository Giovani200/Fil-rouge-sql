type Props = { id: number; titre: string; annee: number; grande?: boolean };

/** Affiche générée : les films n'ont pas d'image, la teinte du dégradé dépend de leur identifiant. */
export function Affiche({ id, titre, annee, grande = false }: Props) {
  const teinte = (id * 47) % 360;
  return (
    <div
      className="relative flex aspect-[2/3] w-full flex-col justify-end overflow-hidden rounded-xl p-4 shadow-lg shadow-black/40 ring-1 ring-white/10"
      style={{ background: `linear-gradient(160deg, hsl(${teinte} 55% 34%), hsl(${(teinte + 40) % 360} 60% 11%))` }}
    >
      <span className="absolute top-3 left-4 text-[10px] font-semibold tracking-[0.3em] text-white/50 uppercase">FilmBox</span>
      <span className={`font-titre leading-tight font-semibold text-white drop-shadow ${grande ? "text-3xl" : "text-lg"}`}>{titre}</span>
      <span className="mt-1 text-xs text-white/70">{annee}</span>
    </div>
  );
}

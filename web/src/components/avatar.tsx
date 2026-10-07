type Props = { id: number; pseudo: string; grand?: boolean };

export function Avatar({ id, pseudo, grand = false }: Props) {
  const teinte = (id * 83) % 360;
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-titre font-semibold text-white uppercase ${grand ? "size-20 text-3xl" : "size-12 text-lg"}`}
      style={{ background: `linear-gradient(135deg, hsl(${teinte} 60% 45%), hsl(${(teinte + 50) % 360} 55% 25%))` }}
    >
      {pseudo[0]}
    </span>
  );
}

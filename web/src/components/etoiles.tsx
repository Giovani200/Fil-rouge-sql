import { formaterMoyenne } from "@/lib/format";

type Props = { note: number | null; taille?: string };

export function Etoiles({ note, taille = "text-base" }: Props) {
  const remplissage = note === null ? 0 : (note / 5) * 100;
  return (
    <span
      role="img"
      aria-label={note === null ? "pas encore noté" : `${formaterMoyenne(note)} sur 5`}
      className={`relative inline-block leading-none tracking-wider ${taille}`}
    >
      <span className="text-bordure">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-ambre" style={{ width: `${remplissage}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

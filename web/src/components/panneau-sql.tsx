import type { Requete } from "@/lib/requete";

export function PanneauSql({ requete }: { requete: Requete }) {
  return (
    <details className="mt-4 rounded-lg border border-bordure bg-fond/60 text-sm">
      <summary className="cursor-pointer px-4 py-2 text-attenue select-none marker:text-ambre hover:text-texte">
        Voir le SQL · <span className="text-ambre">{requete.mission}</span>
      </summary>
      <pre className="overflow-x-auto border-t border-bordure px-4 py-3 font-mono text-xs leading-relaxed text-texte/90">
        {requete.sql}
      </pre>
    </details>
  );
}

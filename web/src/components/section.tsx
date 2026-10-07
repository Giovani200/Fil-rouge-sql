import type { ReactNode } from "react";
import type { Requete } from "@/lib/requete";
import { PanneauSql } from "./panneau-sql";

type Props = { titre: string; requetes?: Requete[]; className?: string; children: ReactNode };

export function Section({ titre, requetes = [], className = "", children }: Props) {
  return (
    <section className={`rounded-2xl border border-bordure bg-surface p-6 ${className}`}>
      <h2 className="font-titre text-xl font-semibold">{titre}</h2>
      <div className="mt-4">{children}</div>
      {requetes.map((requete) => (
        <PanneauSql key={requete.sql} requete={requete} />
      ))}
    </section>
  );
}

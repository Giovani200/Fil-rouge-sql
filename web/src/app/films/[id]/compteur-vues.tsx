"use client";

import { useEffect, useState, useTransition } from "react";
import { enregistrerVue } from "@/app/actions";

type Props = { filmId: number; vuesInitiales: number };

/** Compte la consultation de la fiche une fois la page affichée (en développement, React l'appelle deux fois). */
export function CompteurVues({ filmId, vuesInitiales }: Props) {
  const [vues, setVues] = useState(vuesInitiales);
  const [, demarrer] = useTransition();

  useEffect(() => {
    demarrer(async () => {
      const total = await enregistrerVue(filmId);
      if (total !== null) setVues(total);
    });
  }, [filmId]);

  return (
    <p>
      <span className="font-titre text-3xl">{vues}</span> <span className="text-sm text-attenue">vues</span>
    </p>
  );
}

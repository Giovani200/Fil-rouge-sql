"use client";

import { changerMembre } from "@/app/actions";
import { VISITEUR } from "@/lib/visiteur";

type Props = { membres: { id: number; pseudo: string }[]; membreId: number };

export function ChoixMembre({ membres, membreId }: Props) {
  return (
    <form action={changerMembre} className="flex items-center gap-2 text-sm">
      <label htmlFor="membre" className="text-attenue">
        Connecté en tant que
      </label>
      <select
        key={membreId}
        id="membre"
        name="membre"
        defaultValue={membreId}
        onChange={(evenement) => evenement.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-bordure bg-surface px-2 py-1 text-texte focus:border-ambre focus:outline-none"
      >
        <option value={VISITEUR}>visiteur</option>
        {membres.map((membre) => (
          <option key={membre.id} value={membre.id}>
            {membre.pseudo}
          </option>
        ))}
      </select>
    </form>
  );
}

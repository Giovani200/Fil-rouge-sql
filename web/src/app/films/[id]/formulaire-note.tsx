"use client";

import { useActionState } from "react";
import { noterFilm, type EtatNote } from "@/app/actions";

const ETAT_INITIAL: EtatNote = { message: "", erreur: false };

type Props = { titre: string; noteActuelle: number | null };

export function FormulaireNote({ titre, noteActuelle }: Props) {
  const [etat, action, enCours] = useActionState(noterFilm, ETAT_INITIAL);
  return (
    <form action={action} className="rounded-2xl border border-bordure bg-surface p-5">
      <input type="hidden" name="titre" value={titre} />
      <label htmlFor="note" className="text-sm text-attenue">
        {noteActuelle === null ? "Ta note" : "Ta note (tu peux la changer)"}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <input
          id="note"
          name="note"
          type="number"
          step="0.5"
          required
          defaultValue={noteActuelle ?? ""}
          className="w-24 rounded-lg border border-bordure bg-fond px-3 py-2 text-lg focus:border-ambre focus:outline-none"
        />
        <span className="text-attenue">/ 5</span>
        <button
          disabled={enCours}
          className="ml-auto rounded-full bg-ambre px-5 py-2 font-medium text-fond transition hover:brightness-110 disabled:opacity-50"
        >
          {enCours ? "Envoi…" : "Noter"}
        </button>
      </div>
      {etat.message && (
        <p role="status" className={`mt-3 text-sm ${etat.erreur ? "text-rouge" : "text-vert"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}

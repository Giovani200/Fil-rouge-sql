"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { DatabaseError } from "pg";
import { avecMembre } from "@/lib/db";
import { formaterMoyenne } from "@/lib/format";
import { COOKIE_MEMBRE, membreConnecte } from "@/lib/membre";
import { entierPositif, lireMembre } from "@/lib/parametres";
import { incrementerVues, noter } from "@/lib/requetes/films";
import { VISITEUR } from "@/lib/visiteur";

const CODE_RAISE_EXCEPTION = "P0001";

export type EtatNote = { message: string; erreur: boolean };

/**
 * Note un film avec la procédure `noter` (M13.1). Ses refus (M13.2 : « Note invalide », « Film inconnu »…)
 * sont renvoyés tels quels au formulaire ; toute autre erreur remonte à la page d'erreur.
 */
export async function noterFilm(_etat: EtatNote, formData: FormData): Promise<EtatNote> {
  const membreId = await membreConnecte();
  if (membreId === VISITEUR) {
    return { message: "Choisis un membre en haut de la page pour noter.", erreur: true };
  }
  const note = String(formData.get("note") ?? "").trim();
  if (note === "" || Number.isNaN(Number(note))) {
    return { message: "Saisis une note entre 0,5 et 5, par demi-point.", erreur: true };
  }
  try {
    const moyenne = await avecMembre(membreId, (client) => noter(client, membreId, String(formData.get("titre")), note));
    refresh();
    return { message: `Note enregistrée. Nouvelle moyenne du film : ${formaterMoyenne(moyenne)}`, erreur: false };
  } catch (erreur) {
    if (erreur instanceof DatabaseError && erreur.code === CODE_RAISE_EXCEPTION) {
      return { message: erreur.message, erreur: true };
    }
    throw erreur;
  }
}

export async function enregistrerVue(filmId: number): Promise<number | null> {
  const id = entierPositif(String(filmId));
  if (id === null) return null;
  return avecMembre(await membreConnecte(), (client) => incrementerVues(client, id));
}

export async function changerMembre(formData: FormData): Promise<void> {
  const membreId = lireMembre(String(formData.get("membre")));
  const cookieStore = await cookies();
  if (membreId === VISITEUR) {
    cookieStore.delete(COOKIE_MEMBRE);
  } else {
    cookieStore.set(COOKIE_MEMBRE, String(membreId), { httpOnly: true, sameSite: "lax", path: "/" });
  }
}

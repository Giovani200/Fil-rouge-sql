import { VISITEUR } from "@/lib/visiteur";

export function entierPositif(texte: string): number | null {
  return /^[1-9]\d*$/.test(texte) ? Number(texte) : null;
}

export function lireMembre(valeur: string | undefined): number {
  return entierPositif(valeur ?? "") ?? VISITEUR;
}

/** Première valeur non vide d'un paramètre de recherche d'URL (qui peut être répété), ou null. */
export function premierParametre(valeur: string | string[] | undefined): string | null {
  const texte = (Array.isArray(valeur) ? valeur[0] : valeur)?.trim();
  return texte ? texte : null;
}

/** Décode un segment d'URL : Next.js transmet `maxou_ciné` sous la forme `maxou_cin%C3%A9`. */
export function decoderSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

const MOYENNE = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NOTE = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export function formaterMoyenne(valeur: number | null): string {
  return valeur === null ? "—" : MOYENNE.format(valeur);
}

export function formaterNote(valeur: number): string {
  return NOTE.format(valeur);
}

/** `valeur` au format `AAAA-MM-JJ`, tel que renvoyé par PostgreSQL pour une colonne DATE. */
export function formaterDate(valeur: string): string {
  return DATE.format(new Date(`${valeur}T00:00:00Z`));
}

/** `valeur` au format `AAAA-MM`. */
export function formaterMois(valeur: string): string {
  return MOIS.format(new Date(`${valeur}-01T00:00:00Z`));
}

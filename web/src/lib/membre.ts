import { cookies } from "next/headers";
import { lireMembre } from "@/lib/parametres";

export const COOKIE_MEMBRE = "membre";

export async function membreConnecte(): Promise<number> {
  return lireMembre((await cookies()).get(COOKIE_MEMBRE)?.value);
}

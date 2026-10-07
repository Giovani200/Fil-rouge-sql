import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { SelecteurMembre } from "@/components/selecteur-membre";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "FilmBox", template: "%s · FilmBox" },
  description: "Front de démonstration du fil rouge « SQL avancé avec PostgreSQL ».",
};

const LIENS = [
  { href: "/", libelle: "Films" },
  { href: "/classements", libelle: "Classements" },
  { href: "/membres", libelle: "Membres" },
  { href: "/bacon", libelle: "Kevin Bacon" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-10 border-b border-bordure bg-fond/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
            <Link href="/" className="font-titre text-2xl font-semibold tracking-tight">
              Film<span className="text-ambre">Box</span>
            </Link>
            <nav className="flex gap-5 text-sm text-attenue">
              {LIENS.map((lien) => (
                <Link key={lien.href} href={lien.href} className="transition hover:text-texte">
                  {lien.libelle}
                </Link>
              ))}
            </nav>
            <div className="ml-auto">
              <Suspense fallback={<span className="text-sm text-attenue">…</span>}>
                <SelecteurMembre />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs text-attenue">
          Front de démonstration du fil rouge « SQL avancé avec PostgreSQL ». Sous chaque bloc, « Voir le SQL »
          montre la requête exécutée et la mission dont elle vient.
        </footer>
      </body>
    </html>
  );
}

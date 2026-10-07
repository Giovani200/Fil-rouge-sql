import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="py-20 text-center">
      <p className="font-titre text-6xl text-ambre">404</p>
      <h1 className="mt-4 font-titre text-2xl">Ce film ou ce membre est introuvable</h1>
      <Link href="/" className="mt-8 inline-block text-sm text-attenue underline-offset-4 hover:text-texte hover:underline">
        Retour au catalogue
      </Link>
    </div>
  );
}

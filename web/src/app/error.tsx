"use client";

import { useEffect } from "react";

export default function Erreur({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-20 text-center">
      <h1 className="font-titre text-2xl">Une erreur est survenue</h1>
      <p className="mt-3 text-sm text-attenue">La base de données est-elle démarrée ? (./init-db.sh)</p>
      <button
        onClick={() => retry()}
        className="mt-8 rounded-full bg-ambre px-5 py-2 text-sm font-medium text-fond transition hover:brightness-110"
      >
        Réessayer
      </button>
    </div>
  );
}

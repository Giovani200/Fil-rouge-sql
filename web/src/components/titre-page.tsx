import type { ReactNode } from "react";

type Props = { surtitre: string; titre: string; children?: ReactNode };

export function TitrePage({ surtitre, titre, children }: Props) {
  return (
    <div className="mb-10">
      <p className="text-xs font-semibold tracking-[0.25em] text-ambre uppercase">{surtitre}</p>
      <h1 className="mt-2 font-titre text-4xl font-semibold tracking-tight sm:text-5xl">{titre}</h1>
      {children && <div className="mt-3 max-w-2xl text-attenue">{children}</div>}
    </div>
  );
}

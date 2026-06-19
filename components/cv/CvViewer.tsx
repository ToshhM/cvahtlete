"use client";

import type { CvData } from "@/app/actions/cv";

/**
 * PLACEHOLDER TEMPORAIRE — sera remplacé à l'ÉTAPE 4 (builder + rendu complet)
 * et enrichi à l'ÉTAPE 5 (mode cinématique 3D).
 * Présent uniquement pour que `app/[slug]/page.tsx` compile dès maintenant.
 */
export default function CvViewer({
  cv,
  isOwner,
}: {
  cv: CvData;
  isOwner: boolean;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="rounded-3xl border border-white/10 bg-[#001b3d]/60 p-10 backdrop-blur-xl">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
          {cv.first} <span className="text-[#8bb6ff]">{cv.last}</span>
        </h1>
        <p className="mt-2 text-lg text-slate-300">
          {cv.sport} — {cv.location}
        </p>
      </div>
    </section>
  );
}

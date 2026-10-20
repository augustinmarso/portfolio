import type { Metadata } from "next";
import Link from "next/link";
import { absolute } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SideScrollNav } from "@/components/side-scroll-nav";
import { Bookshelf } from "@/components/bookshelf";
import { WordReveal } from "@/components/word-reveal";
import { EXERGUE, NOTES, OUVRAGES, SECTIONS, TITRE } from "@/data/manifeste";

export const metadata: Metadata = {
  title: "Pourquoi",
  description:
    "Manifeste d'Augustin Marsollier : matérialisme énergétique, décroissance du design et croissance spirituelle. Foi, fin du modèle industriel, intelligence artificielle et localisme.",
  alternates: { canonical: absolute("/pourquoi/") },
  openGraph: { url: absolute("/pourquoi/"), title: "Pourquoi — manifeste d'Augustin Marsollier" },
};

// Texte enrichi : [n] devient un appel de note, [[texte|/chemin]] un lien interne.
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\]|\[\[[^\]]+\]\])/);
  return (
    <>
      {parts.map((p, i) => {
        const note = p.match(/^\[(\d+)\]$/);
        if (note)
          return (
            <sup key={i} className="ml-0.5 text-[0.6em]">
              <a href={`#note-${note[1]}`} className="text-muted-foreground hover:text-foreground">
                {note[1]}
              </a>
            </sup>
          );
        const link = p.match(/^\[\[([^|]+)\|([^\]]+)\]\]$/);
        if (link)
          return (
            <Link key={i} href={link[2]} className="underline decoration-1 underline-offset-4">
              {link[1]}
            </Link>
          );
        return p;
      })}
    </>
  );
}

const SOMMAIRE = [...SECTIONS, { id: "notes", titre: "notes" }, { id: "ouvrages", titre: "ouvrages" }];

export default function PourquoiPage() {
  return (
    <main className="px-4 pb-24 pt-4 sm:px-6">
      <SiteHeader active="/pourquoi" />

      <header className="pt-10 sm:pt-16">
        <p className="text-lg font-semibold tracking-tight text-muted-foreground">manifeste · dsaa ensaama · 2026</p>
        <h1 className="mt-4 max-w-[18ch] text-[clamp(40px,7.5vw,120px)] font-bold leading-[0.95] tracking-[-0.05em]">
          <Rich text={TITRE} />
        </h1>
      </header>

      <WordReveal text={EXERGUE.texte} caption={EXERGUE.source} />

      <div className="grid gap-x-10 gap-y-10 text-lg font-semibold leading-snug tracking-tight sm:text-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <SideScrollNav items={SOMMAIRE} />
          </div>
        </aside>

        <article className="grid gap-24">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl">{s.titre}</h2>
              {s.paragraphes && (
                <div className="mt-6 grid max-w-[62ch] gap-5 font-normal leading-relaxed">
                  {s.paragraphes.map((p, i) => (
                    <p key={i}>
                      <Rich text={p} />
                    </p>
                  ))}
                </div>
              )}
              {s.liste && (
                <dl className="mt-6 grid gap-6">
                  {s.liste.map((it) => (
                    <div key={it.nom} className="max-w-[62ch]">
                      <dt>{it.nom}</dt>
                      <dd className="mt-1 font-normal text-muted-foreground">{it.detail}</dd>
                      {it.texte && <dd className="mt-3 font-normal leading-relaxed">{it.texte}</dd>}
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}

          <section id="notes" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl">notes</h2>
            <ol className="mt-6 grid max-w-[62ch] gap-4 text-base font-normal leading-relaxed sm:text-lg">
              {NOTES.map((n, i) => (
                <li key={n.terme} id={`note-${i + 1}`} className="grid grid-cols-[2rem_1fr] scroll-mt-24">
                  <span className="text-muted-foreground">{i + 1}</span>
                  <span>
                    <span className="font-semibold">{n.terme}</span> : {n.texte}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section id="ouvrages" className="scroll-mt-24">
            <h2 className="text-2xl sm:text-3xl">ouvrages</h2>
            <div className="mt-8">
              <Bookshelf books={OUVRAGES} />
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

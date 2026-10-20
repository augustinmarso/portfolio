import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { asset } from "@/lib/projects";

export const metadata: Metadata = { title: "Contact — Augustin Marsollier" };

const EMAIL = "marsollier.augustin@gmail.com";
const BEHANCE = "https://www.behance.net/augusti-marsoll1";

export default function ContactPage() {
  return (
    <main className="flex min-h-dvh flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
      <header className="flex flex-wrap-reverse items-end justify-between gap-x-6 gap-y-3">
        <Link href="/" className="text-[clamp(3.25rem,9vw,7.5rem)] font-bold leading-[0.8] tracking-[-0.06em]">
          marsollier
        </Link>
        <div className="ml-auto">
          <SiteNav active="/contact" />
        </div>
      </header>

      <div className="grid flex-1 gap-10 pt-6 text-lg font-semibold leading-snug tracking-tight sm:text-xl lg:grid-cols-2">
        <div className="flex flex-col">
          <p>
            augustin marsollier,
            <br />
            designer produit,
            <br />
            dsaa design produit — ensaama, paris
          </p>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl">projets &amp; collaborations</h2>
            <a href={`mailto:${EMAIL}`} className="mt-6 block hover:underline">
              {EMAIL}
            </a>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl">portfolio</h2>
            <a href={BEHANCE} target="_blank" rel="noreferrer" className="mt-6 block underline underline-offset-4">
              voir le portfolio complet sur behance
            </a>
          </section>

          <p className="mt-auto pt-16">
            <a href={BEHANCE} target="_blank" rel="noreferrer" className="hover:underline">
              behance
            </a>
            ,
            <br />
            <Link href="/" className="hover:underline">
              tous les projets
            </Link>
          </p>
        </div>

        <div className="relative min-h-[60vw] lg:mt-[11.5rem] lg:min-h-0">
          <Image
            src={asset("/projects/banc-tapis-petite-voiture/02.webp")}
            alt="Banc tapis petite voiture, installé en extérieur"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </main>
  );
}

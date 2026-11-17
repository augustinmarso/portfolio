import type { Metadata } from "next";
import { absolute } from "@/lib/site";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { SiteHeader } from "@/components/site-header";
import { asset } from "@/lib/projects";
import { MEET, SOCIALS } from "@/lib/socials";
import { LazyVideo } from "@/components/lazy-video";
import contact from "@/data/pages/contact.json";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter Augustin Marsollier, designer objet et service à Paris : projets, collaborations, stages, appel visio.",
  alternates: { canonical: absolute("/contact/") },
  openGraph: { url: absolute("/contact/"), title: "Contact — Augustin Marsollier" },
};

// Coordonnées dans pages/contact.json (modifiables depuis l'éditeur en ligne).
const EMAIL = contact.email;
const PHONE = { display: contact.telephone.affichage, href: `tel:${contact.telephone.international}` };
// Ouvre la conversation WhatsApp sur le numéro (on y lance l'appel vidéo).
const WHATSAPP = `https://wa.me/${contact.telephone.international.replace(/\D/g, "")}`;
// Identifiant du formulaire Formspree (formspree.io/f/<id>) ; vide, le formulaire ouvre la messagerie du visiteur.
const FORMSPREE_ID = contact.formspree;

export default function ContactPage() {
  return (
    // Sur ordinateur, tout tient dans l'écran : la page ne défile pas.
    <main className="flex min-h-dvh flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 lg:h-dvh lg:overflow-hidden">
      <SiteHeader active="/contact" />

      <div className="grid min-h-0 flex-1 gap-8 pt-4 text-base font-semibold leading-snug tracking-tight sm:text-lg lg:grid-cols-2">
        <div className="flex min-h-0 flex-col">
          <p>
            {contact.identite.map((l, n) => (
              <span key={n} className="block">
                {l}
              </span>
            ))}
          </p>

          <p className="mt-4">
            <a href={PHONE.href} className="hover:underline">
              {PHONE.display}
            </a>
            {" — "}
            <a href={`mailto:${EMAIL}`} className="hover:underline">
              {EMAIL}
            </a>
            <br />
            <a href={MEET} target="_blank" rel="noreferrer" className="hover:underline">
              appel visio → google meet
            </a>
          </p>

          <section className="mt-6">
            <h2 className="text-xl sm:text-2xl">projets &amp; collaborations</h2>
            <ContactForm email={EMAIL} formspreeId={FORMSPREE_ID || undefined} />
          </section>

          <p className="mt-6">
            <Link href="/cv" className="underline underline-offset-4">
              voir le cv
            </Link>
          </p>

          <p className="mt-auto pt-6">
            {SOCIALS.map((s) => (
              <span key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer" className="hover:underline">
                  {s.label}
                </a>
                ,{" "}
              </span>
            ))}
            <br />
            <Link href="/?vue=arborescence" className="hover:underline">
              tous les projets
            </Link>
          </p>
        </div>

        {/* Téléphone : vidéo verticale, comme un appel vidéo, et appel WhatsApp sur le numéro. */}
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          aria-label="Appel vidéo WhatsApp"
          className="relative mx-auto aspect-[9/16] w-full max-w-60 overflow-hidden rounded-2xl bg-muted lg:hidden"
        >
          <LazyVideo
            src={asset("/contact/augustin-telephone.mp4")}
            poster={asset("/contact/augustin-telephone.jpg")}
            className="size-full scale-110 object-cover blur-md"
          />
          {/* Indicateur « en ligne », comme dans une fenêtre d'appel vidéo */}
          <span className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            en ligne
          </span>
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#25d366] px-5 py-2.5 text-base font-semibold text-white shadow-sm">
            appel whatsapp
          </span>
        </a>

      </div>
    </main>
  );
}

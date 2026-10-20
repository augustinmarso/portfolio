import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { SiteHeader } from "@/components/site-header";
import { asset } from "@/lib/projects";
import { SOCIALS } from "@/lib/socials";

export const metadata: Metadata = { title: "Contact — Augustin Marsollier" };

const EMAIL = "marsollier.augustin@gmail.com";
const PHONE = { display: "07 49 32 47 31", href: "tel:+33749324731" };
// À renseigner : identifiant du formulaire Formspree (formspree.io/f/<id>) et lien Google Meet personnel.
// Tant qu'ils sont vides, le formulaire ouvre la messagerie du visiteur et le GIF n'est pas cliquable.
const FORMSPREE_ID = "";
const MEET_URL = "";

export default function ContactPage() {
  return (
    <main className="flex min-h-dvh flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6">
      <SiteHeader active="/contact" />

      <div className="grid flex-1 gap-10 pt-6 text-lg font-semibold leading-snug tracking-tight sm:text-xl lg:grid-cols-2">
        <div className="flex flex-col">
          <p>
            augustin marsollier,
            <br />
            designer objet et service,
            <br />
            dsaa design produit — ensaama, paris
          </p>

          <p className="mt-8">
            <a href={PHONE.href} className="hover:underline">
              {PHONE.display}
            </a>
          </p>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl">projets &amp; collaborations</h2>
            <a href={`mailto:${EMAIL}`} className="mt-6 block hover:underline">
              {EMAIL}
            </a>
            <ContactForm email={EMAIL} formspreeId={FORMSPREE_ID || undefined} />
          </section>

          <section className="mt-12">
            <h2 className="text-2xl sm:text-3xl">parcours</h2>
            <Link href="/cv" className="mt-6 block underline underline-offset-4">
              voir le cv
            </Link>
          </section>

          <p className="mt-auto pt-16">
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

        <div className="group relative min-h-[60vw] lg:mt-[11.5rem] lg:min-h-0">
          {/* Un clic sur le GIF lance la visio (lien Google Meet). */}
          {MEET_URL && (
            <a href={MEET_URL} target="_blank" rel="noreferrer" aria-label="Démarrer une visio" className="absolute inset-0 z-10">
              <span className="absolute bottom-3 left-3 rounded-sm bg-background px-2.5 py-1 text-base font-semibold transition-colors group-hover:bg-foreground group-hover:text-background">
                démarrer la visio
              </span>
            </a>
          )}
          <Image
            src={asset("/contact/augustin.gif")}
            alt="Augustin Marsollier, appuyé contre un arbre"
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

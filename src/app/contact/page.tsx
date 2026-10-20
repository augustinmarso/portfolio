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
// Ouvre la conversation WhatsApp sur le numéro (on y lance l'appel vidéo).
const WHATSAPP = "https://wa.me/33749324731";
// À renseigner : identifiant du formulaire Formspree (formspree.io/f/<id>) et lien Google Meet personnel.
// Tant qu'ils sont vides, le formulaire ouvre la messagerie du visiteur et le bouton du GIF propose une visio par mail.
const FORMSPREE_ID = "";
const MEET_URL = "";

export default function ContactPage() {
  return (
    // Sur ordinateur, tout tient dans l'écran : la page ne défile pas.
    <main className="flex min-h-dvh flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 lg:h-dvh lg:overflow-hidden">
      <SiteHeader active="/contact" />

      <div className="grid min-h-0 flex-1 gap-8 pt-4 text-base font-semibold leading-snug tracking-tight sm:text-lg lg:grid-cols-2">
        <div className="flex min-h-0 flex-col">
          <p>
            augustin marsollier,
            <br />
            designer objet et service,
            <br />
            dsaa design produit — ensaama, paris
          </p>

          <p className="mt-4">
            <a href={PHONE.href} className="hover:underline">
              {PHONE.display}
            </a>
            {" — "}
            <a href={`mailto:${EMAIL}`} className="hover:underline">
              {EMAIL}
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
          className="relative mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl bg-muted lg:hidden"
        >
          <video
            src={asset("/contact/augustin-telephone.mp4")}
            poster={asset("/contact/augustin-telephone.jpg")}
            autoPlay
            muted
            loop
            playsInline
            className="size-full object-cover"
          />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#25d366] px-5 py-2.5 text-base font-semibold text-white shadow-sm">
            appel whatsapp
          </span>
        </a>

        {/* Ordinateur : format écran 16:9 (celui du GIF, sans recadrage), comme une fenêtre de visio. */}
        <div className="group relative hidden aspect-video w-full self-start overflow-hidden rounded-sm bg-muted lg:block">
          {/* Un clic sur le GIF lance la visio Google Meet (sans lien Meet : demande de visio par mail). */}
          <a
            href={MEET_URL || `mailto:${EMAIL}?subject=${encodeURIComponent("Demande de visio")}`}
            target={MEET_URL ? "_blank" : undefined}
            rel="noreferrer"
            aria-label="Lancer le Google Meet"
            className="absolute inset-0 z-10"
          >
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background px-5 py-2.5 text-base font-semibold shadow-sm transition-colors group-hover:bg-foreground group-hover:text-background">
              lancer le google meet
            </span>
          </a>
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

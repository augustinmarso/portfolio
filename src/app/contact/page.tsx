import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { SiteHeader } from "@/components/site-header";
import { asset } from "@/lib/projects";
import { MEET, SOCIALS } from "@/lib/socials";

export const metadata: Metadata = { title: "Contact — Augustin Marsollier" };

const EMAIL = "marsollier.augustin@gmail.com";
const PHONE = { display: "07 49 32 47 31", href: "tel:+33749324731" };
// Ouvre la conversation WhatsApp sur le numéro (on y lance l'appel vidéo).
const WHATSAPP = "https://wa.me/33749324731";
// À renseigner : identifiant du formulaire Formspree (formspree.io/f/<id>) et lien Google Meet personnel.
// Tant qu'ils sont vides, le formulaire ouvre la messagerie du visiteur et le bouton du GIF propose une visio par mail.
const FORMSPREE_ID = "";
const MEET_URL = MEET;

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
          className="relative mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl bg-muted lg:hidden"
        >
          <video
            src={asset("/contact/augustin-telephone.mp4")}
            poster={asset("/contact/augustin-telephone.jpg")}
            autoPlay
            muted
            loop
            playsInline
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

        {/* Ordinateur : format écran 16:9 (celui du GIF, sans recadrage), comme une fenêtre de visio. */}
        <div className="group relative hidden aspect-video w-full self-start overflow-hidden rounded-sm bg-muted lg:block">
          <span className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            en ligne
          </span>
          {/* Un clic sur le GIF lance la visio Google Meet (sans lien Meet : demande de visio par mail). */}
          <a
            href={MEET_URL || `mailto:${EMAIL}?subject=${encodeURIComponent("Demande de visio")}`}
            target={MEET_URL ? "_blank" : undefined}
            rel="noreferrer"
            aria-label="Lancer le Google Meet"
            className="absolute inset-0 z-10"
          >
            {/* Logo Google Meet au centre de la vidéo, qui clignote en transparence */}
            <span className="absolute bottom-6 left-1/2 grid -translate-x-1/2 place-items-center">
              <svg viewBox="0 0 87.5 72" className="meet-blink w-24 drop-shadow-[0_2px_12px_rgb(0_0_0/0.35)] transition-transform duration-300 group-hover:scale-110" aria-hidden>
                <path fill="#00832d" d="M49.5 36l8.53 9.75 11.47 7.33 2-17.02-2-16.64-11.69 6.44z" />
                <path fill="#0066da" d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-9.54-9.95-3z" />
                <path fill="#e94235" d="M20.5 0L0 20.5l10.55 3 9.95-3 2.95-9.41z" />
                <path fill="#2684fc" d="M20.5 20.5H0v31h20.5z" />
                <path fill="#00ac47" d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.85.135 4.85-2.37V11c0-2.535-2.945-3.925-4.91-2.32zM49.5 36v15.5h-29V72h43c3.315 0 6-2.685 6-6V53.08z" />
                <path fill="#ffba00" d="M63.5 0h-43v20.5h29V36l20-16.57V6c0-3.315-2.685-6-6-6z" />
              </svg>
              <span className="mt-2 rounded-full bg-background/90 px-3 py-1 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                lancer le google meet
              </span>
            </span>
          </a>
          <Image
            src={asset("/contact/augustin.gif")}
            alt="Augustin Marsollier, appuyé contre un arbre"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="scale-110 object-cover blur-md"
          />
        </div>
      </div>
    </main>
  );
}

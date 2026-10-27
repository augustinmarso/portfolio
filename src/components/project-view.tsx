import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { FadeImg } from "@/components/fade-img";
import { VideoPlayer } from "@/components/video-player";
import { LazyVideo } from "@/components/lazy-video";
import { ModelViewer } from "@/components/model-viewer";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { LudiloveBento } from "@/components/ludilove-bento";
import { LudiloveUiBento } from "@/components/ludilove-ui-bento";
import { MemoireBook } from "@/components/memoire-book";
import embeds from "@/data/embeds.json";
import { plateStep, projects, STEPS, viewIndices, type Project, type ProjectView } from "@/lib/projects";
import { absolute, jsonLd, ogImage, PERSON } from "@/lib/site";

// Page d'un projet, en deux onglets : « produit » (/projets/<slug>/) et « processus » (/projets/<slug>/processus/).
export function ProjectPageView({ project, view }: { project: Project; view: ProjectView }) {
  const i = projects.indexOf(project);
  const next = projects[(i + 1) % projects.length];
  const text = project.text;
  const produit = view === "produit";
  // Vidéos d'autres chaînes (droits non cédés) : lecteur YouTube intégré, jamais une copie du fichier.
  const embedList = produit
    ? ((embeds as Record<string, { youtube: string; title: string; credit: string; vertical: boolean }[]>)[project.slug] ?? [])
    : [];
  const video = produit ? project.video : undefined;
  // Mémoire « La société de jeux » : ses 17 doubles pages en image sont remplacées par le mémoire
  // mis en page dans le site (vrai texte en Scoutie Sans, BD et flèches gardées), en pleine largeur.
  // Il remplace toutes les planches de l'onglet produit ; les croquis restent dans « processus ».
  const memoire = produit && project.slug === "la-societe-de-jeux";
  const shown = memoire ? [] : viewIndices(project, view);
  // processus rangé par étapes de la méthode : un intertitre avant la première planche de chaque étape
  const byStep = !produit && shown.some((n) => plateStep(project, n));

  const tabs = (
    <nav aria-label="Onglets du projet" className="mt-6 flex gap-5 text-lg font-semibold tracking-tight">
      {(["produit", "processus"] as const).map((v) => (
        <Link
          key={v}
          href={v === "produit" ? `/projets/${project.slug}` : `/projets/${project.slug}/processus`}
          aria-current={v === view ? "page" : undefined}
          className={cn(
            "border-b-2 pb-0.5 transition-colors",
            v === view ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {v}
        </Link>
      ))}
    </nav>
  );

  const nextLink = (
    <Link href={`/projets/${next.slug}`} className="group mt-12 flex items-end justify-between gap-6 border-t pt-6">
      <div>
        <span className="text-lg font-semibold text-muted-foreground">projet suivant</span>
        <p className="text-3xl font-bold lowercase tracking-tight group-hover:underline sm:text-5xl">{next.title}</p>
      </div>
      <Image
        src={next.cover.src}
        alt=""
        width={next.cover.width}
        height={next.cover.height}
        className="hidden h-28 w-auto object-cover sm:block"
      />
    </Link>
  );

  const structured = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.text?.intro,
    url: absolute(`/projets/${project.slug}/`),
    image: ogImage(project.slug),
    dateCreated: project.text?.year ?? undefined,
    keywords: project.text?.themes.join(", "),
    inLanguage: "fr",
    creator: PERSON,
  };

  return (
    <main className="w-full px-4 pb-16 pt-4 sm:px-6">
      {produit && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />}
      <SiteHeader active={null} />

      <section className="grid gap-10 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:pt-4">
        {/* Texte figé : collé à sa position de départ (barre 52 px + marges 16 + 16), il ne bouge jamais ;
            plus haut que la place (écran − 84 px en haut − 64 px de marge basse), il défile dans sa propre colonne. */}
        <div
          className={
            video || embedList.length
              ? "md:pb-4" // projets avec téléphone ou vidéos YouTube : le texte défile avec la page (sinon colonne figée, vidéos coupées)
              : "no-scrollbar md:sticky md:top-[84px] md:max-h-[calc(100dvh-164px)] md:self-start md:overflow-y-auto md:pb-4"
          }
        >
          <h1 className="text-4xl font-bold lowercase leading-[0.95] tracking-tight sm:text-5xl">{project.title}</h1>
          {tabs}

          <dl className="mt-8 grid gap-1 text-lg font-semibold leading-snug tracking-tight">
            {text?.year && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">année</dt>
                <dd>{text.year}</dd>
              </div>
            )}
            {text?.context && (
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">contexte</dt>
                <dd className="lowercase">
                  {/* « ensaama » mène à la page de l'école sur ce projet (ou sa formation). */}
                  {text.ensaama
                    ? text.context.split(/(ENSAAMA)/).map((part, n) =>
                        part === "ENSAAMA" ? (
                          <a key={n} href={text.ensaama} target="_blank" rel="noreferrer" className="underline decoration-1 underline-offset-4 hover:text-muted-foreground">
                            {part}
                          </a>
                        ) : (
                          part
                        )
                      )
                    : text.context}
                </dd>
              </div>
            )}
            {text?.team && (
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">équipe</dt>
                <dd className="lowercase">{text.team}</dd>
              </div>
            )}
            {text?.themes.length ? (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">thèmes</dt>
                <dd>
                  {text.themes.map((t, n) => (
                    <span key={t}>
                      <Link href="/?vue=arborescence" className="underline-offset-4 hover:underline">
                        {t}
                      </Link>
                      {n < text.themes.length - 1 && ", "}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
            {!memoire && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">planches</dt>
                <dd>{shown.length}</dd>
              </div>
            )}
          </dl>

          {text?.intro && <p className="mt-8 max-w-prose text-lg leading-relaxed">{text.intro}</p>}


          {/* Exception : le téléphone sous le texte ; une fois apparu, il reste fixe pendant le défilement. */}
          {video && (
            <figure className="mt-12 md:sticky md:top-[84px]">
              <VideoPlayer src={video.src} poster={video.poster} label={`Vidéo de présentation — ${project.title}`} />
            </figure>
          )}
          {embedList.map((embed) => (
            <figure key={embed.youtube} className="mt-12">
              <YouTubeEmbed id={embed.youtube} title={embed.title} vertical={embed.vertical} />
              <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">{embed.credit}</figcaption>
            </figure>
          ))}
        </div>

        <div className="grid gap-12">
          {produit && project.boucle && (
            <figure>
              <LazyVideo src={project.boucle.src} poster={project.boucle.poster} aria-label={`${project.title} en 3D`} className="h-auto w-full" />
            </figure>
          )}
          {produit && project.modele && (
            <figure>
              <ModelViewer
                src={project.modele}
                poster={project.boucle?.poster ?? project.cover.src}
                label={`${project.title}, modèle 3D à faire tourner`}
              />
              <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">
                modèle 3D : le faire tourner à la souris ou au doigt
              </figcaption>
            </figure>
          )}
          {/* le mémoire commence par sa première de couverture, à côté du texte */}
          {memoire && <MemoireBook pages="cover" />}
          {!memoire && !shown.length && (
            <p className="text-lg font-semibold text-muted-foreground">
              {produit ? "pas encore de planche produit pour ce projet." : "le processus de ce projet n'est pas encore en ligne."}
            </p>
          )}
          {shown.map((n, k) => {
            const img = project.images[n];
            const caption = text?.captions[n];
            const step = plateStep(project, n);
            const newStep = byStep && (k === 0 || plateStep(project, shown[k - 1]) !== step);
            return (
              <Fragment key={img.src}>
                {newStep && (
                  <h2 className="flex items-baseline gap-3 border-t pt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                    {step ? (
                      <>
                        <span className="text-muted-foreground">{String(step).padStart(2, "0")}</span>
                        <Link href={`/processus#etape-${step}`} className="hover:underline">
                          {STEPS[step - 1]}
                        </Link>
                      </>
                    ) : (
                      "autres planches"
                    )}
                  </h2>
                )}
                {newStep && step > 0 && text?.notesEtapes?.[step] && (
                  <div className="-mt-6 grid max-w-prose gap-3 text-lg leading-relaxed">
                    {text.notesEtapes[step].map((para) => (
                      <p key={para}>{para}</p>
                    ))}
                  </div>
                )}
                {/* LudiLove : les composants puis la charte en mouvement, juste avant les planches de la charte. */}
                {produit && project.slug === "ludilove" && img.src.endsWith("/ludilove/04.webp") && (
                  <figure>
                    <LudiloveUiBento />
                    <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">
                      les composants des écrans principaux : accueil, swipe, stories, match, partie, profil, scan, achat
                    </figcaption>
                  </figure>
                )}
                {produit && project.slug === "ludilove" && img.src.endsWith("/ludilove/04.webp") && (
                  <figure>
                    <LudiloveBento />
                    <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">
                      charte en mouvement : logo, mascotte, navigation, typographie, couleurs et pictogrammes
                    </figcaption>
                  </figure>
                )}
              <figure>
                <FadeImg
                  src={img.src}
                  sm={img.sm}
                  alt={caption || `${project.title} — planche ${n + 1}`}
                  width={img.width}
                  height={img.height}
                  priority={k === 0 && !video}
                  sizes="(min-width: 768px) 66vw, 100vw"
                />
                {caption && (
                  <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">{caption.toLowerCase()}</figcaption>
                )}
              </figure>
              </Fragment>
            );
          })}

          {/* Dans la colonne des images : la section va jusqu'en bas et le texte ne se décolle jamais. */}
          {!memoire && nextLink}
        </div>
      </section>

      {memoire && (
        <section aria-label="Le mémoire" className="mt-20">
          <MemoireBook pages="rest" />
          {nextLink}
        </section>
      )}
    </main>
  );
}

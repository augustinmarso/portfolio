import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FadeImg } from "@/components/fade-img";
import { VideoPlayer } from "@/components/video-player";
import { LudiloveBento } from "@/components/ludilove-bento";
import { LudiloveUiBento } from "@/components/ludilove-ui-bento";
import { MemoireBook } from "@/components/memoire-book";
import { getProject, projects } from "@/lib/projects";
import { absolute, excerpt, jsonLd, ogImage, PERSON } from "@/lib/site";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return { title: "Projet" };
  const url = absolute(`/projets/${project.slug}/`);
  const description = excerpt(project.text?.intro ?? `${project.title}, projet d'Augustin Marsollier.`);
  return {
    title: project.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${project.title} — Augustin Marsollier`,
      description,
      images: [{ url: ogImage(project.slug), width: 1200, height: 630, alt: project.title }],
    },
    twitter: { card: "summary_large_image", title: project.title, description, images: [ogImage(project.slug)] },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const i = projects.indexOf(project);
  const next = projects[(i + 1) % projects.length];
  const text = project.text;
  // Mémoire « La société de jeux » : ses 17 doubles pages en image sont remplacées par le mémoire
  // mis en page dans le site (vrai texte en Scoutie Sans, BD et flèches gardées), en pleine largeur.
  const memoire = project.slug === "la-societe-de-jeux";
  const SKIP = memoire ? 17 : 0;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
      <SiteHeader active={null} />

      <section className="grid gap-10 pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:pt-4">
        {/* Texte figé : collé à sa position de départ (barre 52 px + marges 16 + 16), il ne bouge jamais ;
            plus haut que la place (écran − 84 px en haut − 64 px de marge basse), il défile dans sa propre colonne. */}
        <div
          className={
            project.video
              ? "md:pb-4" // projets avec téléphone : le texte défile, le téléphone se fige ensuite (plus bas)
              : "no-scrollbar md:sticky md:top-[84px] md:max-h-[calc(100dvh-164px)] md:self-start md:overflow-y-auto md:pb-4"
          }
        >
          <h1 className="text-4xl font-bold lowercase leading-[0.95] tracking-tight sm:text-5xl">{project.title}</h1>

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
            <div className="flex gap-2">
              <dt className="text-muted-foreground">planches</dt>
              <dd>{project.images.length}</dd>
            </div>
          </dl>

          {text?.intro && <p className="mt-8 max-w-prose text-lg leading-relaxed">{text.intro}</p>}


          {/* Exception : le téléphone sous le texte ; une fois apparu, il reste fixe pendant le défilement. */}
          {project.video && (
            <figure className="mt-12 md:sticky md:top-[84px]">
              <VideoPlayer src={project.video.src} poster={project.video.poster} label={`Vidéo de présentation — ${project.title}`} />
            </figure>
          )}
        </div>

        <div className="grid gap-12">
          {project.images.map((img, n) => {
            if (n < SKIP) return null;
            const caption = text?.captions[n];
            return (
              <Fragment key={img.src}>
                {/* LudiLove : les composants puis la charte en mouvement, juste avant les planches de la charte. */}
                {project.slug === "ludilove" && img.src.endsWith("/ludilove/04.webp") && (
                  <figure>
                    <LudiloveUiBento />
                    <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">
                      les composants des écrans principaux : accueil, swipe, stories, match, partie, profil, scan, achat
                    </figcaption>
                  </figure>
                )}
                {project.slug === "ludilove" && img.src.endsWith("/ludilove/04.webp") && (
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
                  priority={n === 0 && !project.video}
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
          <MemoireBook />
          {nextLink}
        </section>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectReveal } from "@/components/project-reveal";
import { SiteHeader } from "@/components/site-header";
import { VideoPlayer } from "@/components/video-player";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return {
    title: project ? `${project.title} — Augustin Marsollier` : "Projet",
    description: project?.text?.intro,
  };
}

export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const i = projects.indexOf(project);
  const next = projects[(i + 1) % projects.length];
  const text = project.text;

  return (
    <ProjectReveal>
      <main className="w-full px-4 pb-16 pt-4 sm:px-6">
        <SiteHeader active={null} size="md" />

        <section className="grid gap-10 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:pt-16">
          <div className="reveal lg:sticky lg:top-6 lg:self-start">
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
                  <dd className="lowercase">{text.context}</dd>
                </div>
              )}
              {text?.themes.length ? (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">thèmes</dt>
                  <dd>
                    {text.themes.map((t, n) => (
                      <span key={t}>
                        <Link href="/arborescence" className="underline-offset-4 hover:underline">
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
          </div>

          <div className="grid gap-12">
            {project.video && (
              <figure className="reveal">
                <VideoPlayer src={project.video.src} poster={project.video.poster} label={`Vidéo de présentation — ${project.title}`} />
                <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">vidéo de présentation</figcaption>
              </figure>
            )}
            {project.images.map((img, n) => {
              const caption = text?.captions[n];
              return (
                <figure key={img.src} className="reveal">
                  <Image
                    src={img.src}
                    alt={caption || `${project.title} — planche ${n + 1}`}
                    width={img.width}
                    height={img.height}
                    priority={n === 0 && !project.video}
                    sizes="(min-width: 1024px) 66vw, 100vw"
                    className="h-auto w-full bg-muted"
                  />
                  {caption && (
                    <figcaption className="mt-3 text-sm font-semibold text-muted-foreground">{caption.toLowerCase()}</figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </section>

        <Link href={`/projets/${next.slug}`} className="reveal group mt-24 flex items-end justify-between gap-6 border-t pt-6">
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
      </main>
    </ProjectReveal>
  );
}

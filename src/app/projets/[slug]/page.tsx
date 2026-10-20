import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectReveal } from "@/components/project-reveal";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return { title: project ? `${project.title} — Augustin Marsollier` : "Projet" };
}

export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const i = projects.indexOf(project);
  const next = projects[(i + 1) % projects.length];

  return (
    <ProjectReveal>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-8">
        <nav className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-background/90 px-4 py-4 text-sm backdrop-blur sm:-mx-8 sm:px-8">
          <Link href="/" className="hover:underline">
            ← Tous les projets
          </Link>
          <span className="text-muted-foreground">Augustin Marsollier</span>
        </nav>

        <header className="reveal grid gap-2 pb-10 pt-12 sm:pt-20">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-7xl">{project.title}</h1>
          <p className="text-sm text-blue">{project.images.length} planches</p>
        </header>

        <div className="grid gap-4 sm:gap-6">
          {project.images.map((img, n) => (
            <Image
              key={img.src}
              src={img.src}
              alt={`${project.title} — planche ${n + 1}`}
              width={img.width}
              height={img.height}
              priority={n === 0}
              sizes="(min-width: 1152px) 1088px, 100vw"
              className="reveal h-auto w-full bg-muted"
            />
          ))}
        </div>

        <Link
          href={`/projets/${next.slug}`}
          className="reveal group mt-24 flex items-end justify-between gap-6 border-t pt-8"
        >
          <div>
            <span className="text-sm text-muted-foreground">Projet suivant</span>
            <p className="text-3xl font-semibold tracking-tight group-hover:underline sm:text-5xl">
              {next.title}
            </p>
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

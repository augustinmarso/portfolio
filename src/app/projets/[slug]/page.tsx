import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPageView } from "@/components/project-view";
import { getProject, projects } from "@/lib/projects";
import { absolute, excerpt, ogImage } from "@/lib/site";

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

// Onglet « produit » ; l'onglet « processus » est dans ./processus.
export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  return <ProjectPageView project={project} view="produit" />;
}

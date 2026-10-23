import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPageView } from "@/components/project-view";
import { getProject, projects } from "@/lib/projects";
import { absolute, excerpt, ogImage } from "@/lib/site";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]/processus">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return { title: "Processus" };
  const url = absolute(`/projets/${project.slug}/processus/`);
  return {
    title: `${project.title} — processus`,
    description: excerpt(`Processus du projet ${project.title} : recherches, croquis, maquettes et prototypes. ${project.text?.intro ?? ""}`),
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: `${project.title} — processus`, images: [{ url: ogImage(project.slug), width: 1200, height: 630, alt: project.title }] },
  };
}

export default async function ProjectProcessPage({ params }: PageProps<"/projets/[slug]/processus">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  return <ProjectPageView project={project} view="processus" />;
}
